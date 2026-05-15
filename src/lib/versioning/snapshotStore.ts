/**
 * Snapshot file store — persists and retrieves immutable PageRelease snapshots.
 *
 * Storage layout:
 *   releases/
 *     {slug}/
 *       {version}.json    ← one file per release
 *       index.json        ← ordered list of all versions for this slug
 *
 * Why the filesystem?
 *   - Zero infrastructure: no database, no external service.
 *   - Snapshots are immutable — write-once, never updated.
 *   - Files are human-readable and can be committed to git for auditability.
 *   - In production, replace this module with an S3/R2/database adapter
 *     without changing any other versioning code.
 *
 * Why `releases/` at the project root (not inside `src/`)?
 *   - Next.js serves files from `public/` and processes files in `src/`.
 *     Release snapshots are neither — they're server-side data files.
 *   - Keeping them at the root makes them easy to find and gitignore
 *     selectively (e.g. gitignore large snapshot dirs in CI).
 *
 * Concurrency: file writes use atomic rename-on-write semantics via a
 * temp file + rename pattern to prevent partial writes being read.
 * This is sufficient for single-server deployments. For multi-instance
 * deployments, replace with a distributed store.
 *
 * Node.js runtime only — never import from edge middleware.
 */

import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import type { PageRelease } from '@/types/page';

// ─── Paths ────────────────────────────────────────────────────────────────────

/** Root directory for all release snapshots. */
const RELEASES_ROOT = join(process.cwd(), 'releases');

export function snapshotPath(slug: string, version: string): string {
  return join(RELEASES_ROOT, slug, `${version}.json`);
}

export function indexPath(slug: string): string {
  return join(RELEASES_ROOT, slug, 'index.json');
}

// ─── Index type ───────────────────────────────────────────────────────────────

interface SlugIndex {
  slug: string;
  versions: string[]; // ordered oldest → newest
  latestVersion: string | null;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Load a specific release snapshot by slug + version.
 * Returns null if the file does not exist.
 */
export async function loadSnapshot(
  slug: string,
  version: string,
): Promise<PageRelease | null> {
  const path = snapshotPath(slug, version);
  if (!existsSync(path)) return null;
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as PageRelease;
  } catch {
    return null;
  }
}

/**
 * Load the index for a slug.
 * Returns an empty index if none exists yet.
 */
export async function loadIndex(slug: string): Promise<SlugIndex> {
  const path = indexPath(slug);
  if (!existsSync(path)) {
    return { slug, versions: [], latestVersion: null };
  }
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as SlugIndex;
  } catch {
    return { slug, versions: [], latestVersion: null };
  }
}

/**
 * Load the latest release for a slug.
 * Returns null if no releases exist.
 */
export async function loadLatestSnapshot(
  slug: string,
): Promise<PageRelease | null> {
  const index = await loadIndex(slug);
  if (!index.latestVersion) return null;
  return loadSnapshot(slug, index.latestVersion);
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Persist a release snapshot to disk.
 *
 * Idempotent: if a file already exists at the target path with the same
 * content hash, the write is skipped. This prevents overwriting an existing
 * immutable snapshot with different content (which would indicate a bug).
 *
 * Returns 'written' | 'skipped' | 'conflict'.
 */
export async function saveSnapshot(
  release: PageRelease,
): Promise<'written' | 'skipped' | 'conflict'> {
  const path = snapshotPath(release.slug, release.version);

  // Check for existing snapshot at this version
  if (existsSync(path)) {
    const existing = await loadSnapshot(release.slug, release.version);
    if (existing?.contentHash === release.contentHash) {
      return 'skipped'; // identical content — idempotent
    }
    // Different content at same version — this is a bug in the caller
    return 'conflict';
  }

  // Ensure directory exists
  await mkdir(dirname(path), { recursive: true });

  // Atomic write: write to temp file, then rename
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(release, null, 2), 'utf-8');
  await rename(tmp, path);

  // Update the index
  await updateIndex(release.slug, release.version);

  return 'written';
}

// ─── Index management ─────────────────────────────────────────────────────────

async function updateIndex(slug: string, newVersion: string): Promise<void> {
  const path = indexPath(slug);
  const index = await loadIndex(slug);

  if (!index.versions.includes(newVersion)) {
    index.versions.push(newVersion);
    // Keep versions sorted oldest → newest
    index.versions.sort((a, b) => {
      const [aMaj = 0, aMin = 0, aPat = 0] = a.split('.').map(Number);
      const [bMaj = 0, bMin = 0, bPat = 0] = b.split('.').map(Number);
      return aMaj !== bMaj ? aMaj - bMaj
           : aMin !== bMin ? aMin - bMin
           : aPat - bPat;
    });
    index.latestVersion = index.versions.at(-1) ?? null;
  }

  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(index, null, 2), 'utf-8');
  await rename(tmp, path);
}
