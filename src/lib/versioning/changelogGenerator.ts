/**
 * Changelog generator — converts a PageDiff into human-readable entries.
 *
 * Design goals:
 *   - Each entry is self-contained: a reader can understand it without
 *     context from other entries.
 *   - Entries are sorted by severity (major first) so the most important
 *     changes appear at the top.
 *   - Section IDs are included in messages so developers can trace changes
 *     back to specific CMS entries.
 *   - Pure function: (PageDiff) → ChangelogEntry[]. No side effects.
 */

import type { ChangelogEntry, PageDiff, PageDiffChange } from '@/types/page';
import { changeSeverity } from './semverCalculator';

// ─── Section type labels ──────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  hero:        'Hero',
  featureGrid: 'Feature Grid',
  testimonial: 'Testimonial',
  cta:         'Call to Action',
};

function sectionLabel(type: string): string {
  return SECTION_LABELS[type] ?? type;
}

// ─── Change → message ─────────────────────────────────────────────────────────

function changeToEntry(change: PageDiffChange): ChangelogEntry {
  const severity = changeSeverity(change);

  switch (change.kind) {
    case 'section-added':
      return {
        severity,
        message: `Added ${sectionLabel(change.sectionType)} section (${change.sectionId})`,
      };

    case 'section-removed':
      return {
        severity,
        message: `Removed ${sectionLabel(change.sectionType)} section (${change.sectionId})`,
      };

    case 'section-type-changed':
      return {
        severity,
        message:
          `Changed section type from "${sectionLabel(change.from)}" to ` +
          `"${sectionLabel(change.to)}" (${change.sectionId})`,
      };

    case 'section-reordered':
      return {
        severity,
        message:
          `Reordered section ${change.sectionId} ` +
          `(position ${change.fromIndex + 1} → ${change.toIndex + 1})`,
      };

    case 'section-props-changed': {
      const keys = change.changedKeys.join(', ');
      return {
        severity,
        message:
          `Updated ${sectionLabel(change.sectionType)} section props: ${keys} ` +
          `(${change.sectionId})`,
      };
    }

    case 'page-title-changed':
      return {
        severity,
        message: `Updated page title: "${change.from}" → "${change.to}"`,
      };
  }
}

// ─── Severity sort order ──────────────────────────────────────────────────────

const SEVERITY_SORT: Record<ChangelogEntry['severity'], number> = {
  major: 0,
  minor: 1,
  patch: 2,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a sorted changelog from a PageDiff.
 *
 * Returns an empty array when the diff is identical (no changes).
 * Entries are sorted: major → minor → patch, then by message alphabetically
 * within each severity group for determinism.
 */
export function generateChangelog(diff: PageDiff): ChangelogEntry[] {
  if (diff.isIdentical || diff.changes.length === 0) return [];

  return diff.changes
    .map(changeToEntry)
    .sort((a, b) => {
      const severityDiff = SEVERITY_SORT[a.severity] - SEVERITY_SORT[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.message.localeCompare(b.message);
    });
}

/**
 * Format a changelog as a plain-text string for logging or display.
 */
export function formatChangelog(entries: ChangelogEntry[]): string {
  if (entries.length === 0) return 'No changes.';
  return entries
    .map((e) => `[${e.severity.toUpperCase()}] ${e.message}`)
    .join('\n');
}
