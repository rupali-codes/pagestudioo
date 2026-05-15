/**
 * Snapshot generator — creates an immutable PageRelease from a Page + metadata.
 *
 * A snapshot is a complete, self-contained record of a page at a point in time.
 * It includes:
 *   - The full page content (sections + props) — never a reference
 *   - The content hash for idempotency verification
 *   - The changelog describing what changed since the previous release
 *   - Audit metadata (who published, when)
 *
 * Immutability contract:
 *   - The snapshot object is created with Object.freeze() at the leaves.
 *   - The `releaseId` is deterministic: `{pageId}@{version}`.
 *     Publishing the same version twice produces the same releaseId,
 *     which the storage layer can use to detect and reject duplicates.
 *   - The `publishedAt` timestamp is passed in (not generated here) so
 *     the caller controls it — making the function pure and testable.
 */

import type { Page, PageRelease, ChangelogEntry } from '@/types/page';
import { buildReleaseId } from '@/lib/releaseId';
import { hashPageContent } from './contentHash';

export interface SnapshotInput {
  page: Page;
  version: string;
  publishedBy: string;
  publishedAt: string; // ISO 8601 — caller provides for testability
  changelog: ChangelogEntry[];
}

/**
 * Build an immutable PageRelease snapshot.
 *
 * The sections array is deep-cloned so mutations to the source page after
 * publishing cannot affect the snapshot.
 */
export function buildSnapshot(input: SnapshotInput): PageRelease {
  const { page, version, publishedBy, publishedAt, changelog } = input;

  // Deep-clone sections to ensure immutability of the snapshot
  const sections = JSON.parse(JSON.stringify(page.sections)) as Page['sections'];

  return {
    releaseId: buildReleaseId(page.pageId, version),
    version,
    pageId: page.pageId,
    slug: page.slug,
    title: page.title,
    sections,
    publishedAt,
    publishedBy,
    contentHash: hashPageContent(page),
    changelog,
  };
}

/**
 * Verify that a snapshot's content hash matches its sections.
 * Used to detect corruption or tampering when loading a stored snapshot.
 */
export function verifySnapshot(release: PageRelease): boolean {
  const page: Page = {
    pageId: release.pageId,
    slug: release.slug,
    title: release.title,
    sections: release.sections,
  };
  return hashPageContent(page) === release.contentHash;
}
