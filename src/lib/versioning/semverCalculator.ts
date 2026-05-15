/**
 * Semver calculator — derives the correct version bump from a PageDiff.
 *
 * Rules (in priority order — highest wins):
 *
 *   MAJOR (breaking):
 *     - A section is removed          → consumers depending on that section break
 *     - A section's type changes      → the rendered output is fundamentally different
 *
 *   MINOR (additive, non-breaking):
 *     - A section is added            → new content, existing consumers unaffected
 *
 *   PATCH (non-breaking, non-additive):
 *     - Section props changed         → copy/value update, same structure
 *     - Section reordered             → layout change, same sections
 *     - Page title changed            → metadata only
 *
 * Why these rules?
 *   The semver contract here is about the *rendered page structure*, not an
 *   API surface. "Breaking" means a consumer (e.g. a cached CDN response,
 *   an RSS feed, a sitemap) would receive structurally different content.
 *   Removing or changing a section type is breaking; adding one is additive.
 *
 * First publish:
 *   When there is no previous version, the initial version is always "0.1.0"
 *   (minor bump from 0.0.0) regardless of content — the page is new.
 *
 * Idempotency:
 *   If the diff is identical (same hash), no bump is applied and the caller
 *   should skip publishing entirely.
 */

import type { PageDiff, PageDiffChange } from '@/types/page';
import type { BumpType } from '@/lib/semver';
import { bumpVersion, parseSemVer, formatSemVer } from '@/lib/semver';

// ─── Change → severity mapping ────────────────────────────────────────────────

/**
 * Map a single diff change to its semver severity.
 * This is the authoritative mapping — change it here to change policy.
 */
export function changeSeverity(change: PageDiffChange): BumpType {
  switch (change.kind) {
    case 'section-removed':
    case 'section-type-changed':
      return 'major';

    case 'section-added':
      return 'minor';

    case 'section-props-changed':
    case 'section-reordered':
    case 'page-title-changed':
      return 'patch';
  }
}

// ─── Severity ordering ────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<BumpType, number> = {
  patch: 0,
  minor: 1,
  major: 2,
};

/**
 * Reduce a list of bump types to the highest severity.
 * Returns 'patch' for an empty list (no changes → patch is the minimum bump
 * when we know content changed but can't classify it).
 */
export function highestSeverity(bumps: BumpType[]): BumpType {
  if (bumps.length === 0) return 'patch';
  return bumps.reduce((acc, b) =>
    SEVERITY_ORDER[b] > SEVERITY_ORDER[acc] ? b : acc,
  );
}

// ─── Version calculation ──────────────────────────────────────────────────────

export interface VersionCalculationResult {
  /** The new version string. */
  version: string;
  /** The bump type applied. */
  bumpType: BumpType;
  /**
   * True when the diff was identical — caller should skip publishing.
   * `version` will equal `previousVersion` in this case.
   */
  isNoop: boolean;
}

/**
 * Calculate the next version given a diff and the previous version.
 *
 * @param diff            - Output of `diffPages(previous, next)`.
 * @param previousVersion - The version string of the last release, or null
 *                          for the very first publish.
 */
export function calculateNextVersion(
  diff: PageDiff,
  previousVersion: string | null,
): VersionCalculationResult {
  // Idempotency: identical content → no new version
  if (diff.isIdentical && previousVersion !== null) {
    return {
      version: previousVersion,
      bumpType: 'patch',
      isNoop: true,
    };
  }

  // First publish: start at 0.1.0 (minor from 0.0.0)
  if (previousVersion === null) {
    return {
      version: '0.1.0',
      bumpType: 'minor',
      isNoop: false,
    };
  }

  // Derive bump type from the diff
  const severities = diff.changes.map(changeSeverity);
  const bumpType = highestSeverity(severities);
  const version = bumpVersion(previousVersion, bumpType);

  return { version, bumpType, isNoop: false };
}

/**
 * Ensure a version string is strictly greater than `previousVersion`.
 *
 * This guards against clock skew or race conditions where two publishes
 * calculate the same version. If `candidate` ≤ `previous`, we force a
 * patch bump on top of `previous`.
 *
 * Pure function — no side effects.
 */
export function ensureVersionIncrement(
  candidate: string,
  previous: string,
): string {
  const c = parseSemVer(candidate);
  const p = parseSemVer(previous);

  const cNum = c.major * 1_000_000 + c.minor * 1_000 + c.patch;
  const pNum = p.major * 1_000_000 + p.minor * 1_000 + p.patch;

  if (cNum > pNum) return candidate;

  // Force a patch bump on top of previous
  return formatSemVer({ ...p, patch: p.patch + 1 });
}
