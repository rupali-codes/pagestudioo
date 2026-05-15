/**
 * POST /api/publish — create an immutable versioned release.
 *
 * Protected: requires 'page:publish' permission (publisher or admin role).
 * The middleware blocks unauthenticated/unauthorized requests at the edge,
 * but the guard here performs full cryptographic session verification —
 * defence in depth against middleware bypass.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PageSchema } from '@/schemas/page';
import { bumpVersion, latestVersion, determineBumpType } from '@/lib/semver';
import { buildReleaseId } from '@/lib/releaseId';
import { guardApiRoute } from '@/lib/auth/guards';
import type { PageRelease } from '@/types/page';

const PublishRequestSchema = z.object({
  page: PageSchema,
  publishedBy: z.string().min(1),
  previousVersion: z.string().optional(),
  previousSectionTypes: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  // ── Server-side permission check ─────────────────────────────────────────
  // Full cryptographic verification — not just the edge cookie fast-path.
  // This catches any request that bypassed middleware (direct API calls,
  // misconfigured proxies, etc.).
  const guard = await guardApiRoute(request, 'page:publish');
  if (guard.error) return guard.error;

  // guard.session is now typed as Session (non-null)
  const { session } = guard;

  // ── Parse and validate body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = PublishRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { page, previousVersion, previousSectionTypes } = parsed.data;

  // Use the authenticated session's userId as the publisher — never trust
  // the client-supplied publishedBy field for audit purposes.
  const publishedBy = session.userId;

  // ── Semver calculation ────────────────────────────────────────────────────
  const currentSectionTypes = page.sections.map((s) => s.type);
  const bumpType = determineBumpType(
    previousSectionTypes ?? [],
    currentSectionTypes,
  );

  const baseVersion = previousVersion ?? '0.0.0';
  const version = bumpVersion(baseVersion, bumpType);

  const allVersions = previousVersion ? [previousVersion] : [];
  const latest = latestVersion(allVersions);
  const finalVersion =
    latest && latest >= version ? bumpVersion(latest, 'patch') : version;

  const release: PageRelease = {
    releaseId: buildReleaseId(page.pageId, finalVersion),
    version: finalVersion,
    pageId: page.pageId,
    slug: page.slug,
    title: page.title,
    sections: page.sections,
    publishedAt: new Date().toISOString(),
    publishedBy,
  };

  return NextResponse.json({ release }, { status: 201 });
}
