/**
 * Publish service — orchestrates the full publish pipeline.
 *
 * Pipeline:
 *   1. Load the latest snapshot for this slug (previous state).
 *   2. Diff previous vs. next (draft).
 *   3. Check idempotency: if content is identical, return the existing release.
 *   4. Calculate the next semver version.
 *   5. Generate the changelog.
 *   6. Build the immutable snapshot.
 *   7. Persist the snapshot to disk.
 *   8. Return the release + metadata.
 *
 * Determinism guarantee:
 *   Given the same `page` content and the same `previousRelease`, this
 *   function always produces the same `version`, `contentHash`, and
 *   `changelog`. The only non-deterministic field is `publishedAt`
 *   (the timestamp), which is injected by the caller for testability.
 *
 * Idempotency guarantee:
 *   If the same draft is submitted twice, the second call returns
 *   `{ status: 'noop', release: existingRelease }` without creating a new
 *   snapshot or bumping the version.
 *
 * Node.js runtime only — uses filesystem APIs.
 */

import type { Page, PageRelease } from '@/types/page';
import type { Result } from '@/lib/result';
import { ok, err } from '@/lib/result';
import { diffPages } from './diffEngine';
import { calculateNextVersion, ensureVersionIncrement } from './semverCalculator';
import { generateChangelog } from './changelogGenerator';
import { buildSnapshot, verifySnapshot } from './snapshotGenerator';
import { loadLatestSnapshot, saveSnapshot } from './snapshotStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PublishStatus =
  | 'published'   // new release created
  | 'noop'        // content unchanged — no new release
  | 'conflict';   // version collision (should not happen in normal flow)

export interface PublishResult {
  status: PublishStatus;
  release: PageRelease;
  /** The previous release, if one existed. */
  previousRelease: PageRelease | null;
  /** Null when status is 'noop'. */
  bumpType: 'major' | 'minor' | 'patch' | null;
}

export interface PublishInput {
  /** The draft page to publish. */
  page: Page;
  /** User ID of the publisher (from the verified session). */
  publishedBy: string;
  /**
   * ISO 8601 timestamp. Injected by the caller so the service stays pure
   * and tests can control the timestamp.
   * Defaults to `new Date().toISOString()` if not provided.
   */
  publishedAt?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Publish a page draft, producing an immutable versioned release.
 *
 * Returns a Result so callers never need try/catch.
 */
export async function publishPage(
  input: PublishInput,
): Promise<Result<PublishResult>> {
  const { page, publishedBy, publishedAt = new Date().toISOString() } = input;

  try {
    // Step 1: load previous state
    const previousRelease = await loadLatestSnapshot(page.slug);

    // Verify the previous snapshot hasn't been corrupted
    if (previousRelease && !verifySnapshot(previousRelease)) {
      return err(
        new Error(
          `Snapshot integrity check failed for ${page.slug}@${previousRelease.version}. ` +
            `The stored snapshot may have been tampered with.`,
        ),
      );
    }

    const previousPage: Page | null = previousRelease
      ? {
          pageId: previousRelease.pageId,
          slug: previousRelease.slug,
          title: previousRelease.title,
          sections: previousRelease.sections,
        }
      : null;

    // Step 2: diff
    const diff = diffPages(previousPage, page);

    // Step 3: idempotency check
    const versionResult = calculateNextVersion(
      diff,
      previousRelease?.version ?? null,
    );

    if (versionResult.isNoop && previousRelease) {
      return ok({
        status: 'noop',
        release: previousRelease,
        previousRelease,
        bumpType: null,
      });
    }

    // Step 4: ensure version is strictly greater than previous
    const version =
      previousRelease
        ? ensureVersionIncrement(versionResult.version, previousRelease.version)
        : versionResult.version;

    // Step 5: generate changelog
    const changelog = generateChangelog(diff);

    // Step 6: build snapshot
    const release = buildSnapshot({
      page,
      version,
      publishedBy,
      publishedAt,
      changelog,
    });

    // Step 7: persist
    const saveResult = await saveSnapshot(release);

    if (saveResult === 'conflict') {
      return err(
        new Error(
          `Version conflict: ${page.slug}@${version} already exists with different content. ` +
            `This indicates a race condition or a bug in the version calculator.`,
        ),
      );
    }

    return ok({
      status: saveResult === 'skipped' ? 'noop' : 'published',
      release,
      previousRelease,
      bumpType: versionResult.bumpType,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
