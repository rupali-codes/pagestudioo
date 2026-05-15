/**
 * POST /api/publish — create an immutable versioned release.
 *
 * Protected: requires 'page:publish' permission (publisher).
 *
 * Request body: { page: Page }
 *
 * Response 201: { release: PageRelease, status: PublishStatus, bumpType }
 * Response 200: { release: PageRelease, status: 'noop' }  (identical content)
 * Response 401/403: auth errors from guardApiRoute
 * Response 422: schema validation failure
 * Response 500: publish service error
 *
 * The route delegates all versioning logic to publishService — it owns
 * only HTTP concerns (auth, parsing, response shaping).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { PageSchema } from '@/schemas/page';
import { guardApiRoute } from '@/lib/auth/guards';
import { publishPage } from '@/lib/versioning/publishService';

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const guard = await guardApiRoute(request, 'page:publish');
  if (guard.error) return guard.error;
  const { session } = guard;

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate only the page field — version metadata is computed server-side
  const parsed = PageSchema.safeParse(
    (body as Record<string, unknown>)?.page ?? body,
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  const result = await publishPage({
    page: parsed.data,
    publishedBy: session.userId,
    publishedAt: new Date().toISOString(),
  });

  if (!result.ok) {
    console.error('[api/publish]', result.error.message);
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 },
    );
  }

  const { status, release, bumpType } = result.value;

  // 200 for noop (no new version created), 201 for a new release
  const httpStatus = status === 'noop' ? 200 : 201;

  return NextResponse.json(
    {
      status,
      bumpType,
      release,
      changelog: release.changelog,
    },
    { status: httpStatus },
  );
}
