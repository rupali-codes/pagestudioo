import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PageSchema } from '@/schemas/page';
import { bumpVersion, latestVersion, determineBumpType } from '@/lib/semver';
import { buildReleaseId } from '@/lib/releaseId';
import type { PageRelease } from '@/types/page';

const PublishRequestSchema = z.object({
  page: PageSchema,
  publishedBy: z.string().min(1),
  previousVersion: z.string().optional(),
  previousSectionTypes: z.array(z.string()).optional(),
});

/**
 * POST /api/publish
 *
 * Creates an immutable versioned release from the current page state.
 * In production this would persist to a database; here it returns the
 * release object for the client to store in Redux.
 */
export async function POST(request: NextRequest) {
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

  const { page, publishedBy, previousVersion, previousSectionTypes } =
    parsed.data;

  const currentSectionTypes = page.sections.map((s) => s.type);
  const bumpType = determineBumpType(
    previousSectionTypes ?? [],
    currentSectionTypes,
  );

  const baseVersion = previousVersion ?? '0.0.0';
  const version = bumpVersion(baseVersion, bumpType);

  // Ensure version is unique (in production, check against DB)
  const allVersions = previousVersion ? [previousVersion] : [];
  const latest = latestVersion(allVersions);
  const finalVersion = latest && latest >= version ? bumpVersion(latest, 'patch') : version;

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
