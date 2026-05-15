/**
 * GET /api/releases/[slug] — list all releases for a page slug.
 * GET /api/releases/[slug]?version=1.2.0 — fetch a specific release.
 *
 * Protected: requires 'page:read' permission (any authenticated role).
 *
 * Response 200: { releases: PageRelease[] } or { release: PageRelease }
 * Response 404: slug or version not found
 * Response 401/403: auth errors
 */

import { type NextRequest, NextResponse } from 'next/server';
import { guardApiRoute } from '@/lib/auth/guards';
import {
  loadIndex,
  loadSnapshot,
  loadLatestSnapshot,
} from '@/lib/versioning/snapshotStore';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Any authenticated user can read release history
  const guard = await guardApiRoute(request, 'page:read');
  if (guard.error) return guard.error;

  const { slug } = await params;
  const version = request.nextUrl.searchParams.get('version');

  // ── Single version ────────────────────────────────────────────────────────
  if (version) {
    const release = await loadSnapshot(slug, version);
    if (!release) {
      return NextResponse.json(
        { error: `Release not found: ${slug}@${version}` },
        { status: 404 },
      );
    }
    return NextResponse.json({ release });
  }

  // ── Latest only ───────────────────────────────────────────────────────────
  const latestParam = request.nextUrl.searchParams.get('latest');
  if (latestParam === 'true') {
    const release = await loadLatestSnapshot(slug);
    if (!release) {
      return NextResponse.json(
        { error: `No releases found for: ${slug}` },
        { status: 404 },
      );
    }
    return NextResponse.json({ release });
  }

  // ── Full history ──────────────────────────────────────────────────────────
  const index = await loadIndex(slug);

  if (index.versions.length === 0) {
    return NextResponse.json({ releases: [], latestVersion: null });
  }

  // Load all snapshots in parallel — newest first
  const snapshots = await Promise.all(
    [...index.versions].reverse().map((v) => loadSnapshot(slug, v)),
  );

  const releases = snapshots.filter(
    (r): r is NonNullable<typeof r> => r !== null,
  );

  return NextResponse.json({
    releases,
    latestVersion: index.latestVersion,
    totalCount: releases.length,
  });
}
