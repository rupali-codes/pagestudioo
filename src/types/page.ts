/**
 * Domain types for pages, sections, releases, and diffs.
 * CMS adapters map raw CMS data to these types.
 * The versioning system operates exclusively on these types.
 */

export type SectionType = 'hero' | 'featureGrid' | 'testimonial' | 'cta';

export interface Section {
  id: string;
  type: SectionType;
  props: Record<string, unknown>;
}

export interface Page {
  pageId: string;
  slug: string;
  title: string;
  sections: Section[];
}

// ─── Release ──────────────────────────────────────────────────────────────────

/**
 * An immutable, versioned snapshot of a page at the moment of publishing.
 *
 * Once created, a PageRelease is never mutated. The `contentHash` field
 * enables idempotency: publishing the same content twice produces the same
 * hash, and the publish service can detect and skip duplicate publishes.
 */
export interface PageRelease {
  /** Deterministic ID: `{pageId}@{version}` */
  releaseId: string;
  /** Semver string e.g. "1.2.0" */
  version: string;
  pageId: string;
  slug: string;
  title: string;
  sections: Section[];
  /** ISO 8601 timestamp */
  publishedAt: string;
  /** User ID of the publisher */
  publishedBy: string;
  /**
   * SHA-256 hex digest of the canonical page content.
   * Used for idempotency: same content → same hash → skip re-publish.
   */
  contentHash: string;
  /** Human-readable summary of what changed since the previous release. */
  changelog: ChangelogEntry[];
}

// ─── Diff ─────────────────────────────────────────────────────────────────────

/**
 * Discriminated union of all possible changes between two page versions.
 *
 * Each change type maps to a semver bump level:
 *   - SectionAdded        → minor
 *   - SectionRemoved      → major
 *   - SectionTypeChanged  → major
 *   - SectionReordered    → patch
 *   - SectionPropsChanged → patch (or minor if a new required prop was added)
 *   - PageTitleChanged    → patch
 *
 * The diff engine produces an array of these; the semver calculator
 * reduces them to a single BumpType by taking the highest severity.
 */
export type PageDiffChange =
  | { kind: 'section-added';        sectionId: string; sectionType: SectionType }
  | { kind: 'section-removed';      sectionId: string; sectionType: SectionType }
  | { kind: 'section-type-changed'; sectionId: string; from: SectionType; to: SectionType }
  | { kind: 'section-reordered';    sectionId: string; fromIndex: number; toIndex: number }
  | { kind: 'section-props-changed';sectionId: string; sectionType: SectionType; changedKeys: string[] }
  | { kind: 'page-title-changed';   from: string; to: string };

export interface PageDiff {
  /** True when the two pages are content-identical (same hash). */
  isIdentical: boolean;
  changes: PageDiffChange[];
}

// ─── Changelog ────────────────────────────────────────────────────────────────

export interface ChangelogEntry {
  /** Semver bump level this entry contributes. */
  severity: 'major' | 'minor' | 'patch';
  /** Human-readable description. */
  message: string;
}
