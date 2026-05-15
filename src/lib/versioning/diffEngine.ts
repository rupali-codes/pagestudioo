/**
 * Page diff engine.
 *
 * Produces a typed list of changes between two Page snapshots.
 * This is the foundation of the versioning system — every downstream
 * decision (semver bump, changelog) is derived from this diff.
 *
 * Design principles:
 *   - Pure function: (Page, Page) → PageDiff. No side effects.
 *   - Deterministic: same inputs always produce the same output.
 *   - Exhaustive: every observable change is captured as a typed record.
 *   - Section identity: sections are matched by `id`, not by position.
 *     This means moving a section is detected as a reorder, not a
 *     remove + add, which would incorrectly trigger a major bump.
 *
 * Change detection order:
 *   1. Fast path: compare content hashes. If identical, return early.
 *   2. Page-level fields (title).
 *   3. Sections present in `previous` but absent in `next` → removed (major).
 *   4. Sections present in `next` but absent in `previous` → added (minor).
 *   5. Sections present in both → check type change, prop changes.
 *   6. Section order changes → reordered (patch).
 */

import type { Page, PageDiff, PageDiffChange, Section } from '@/types/page';
import { hashPageContent } from './contentHash';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the diff between `previous` and `next` page snapshots.
 *
 * @param previous - The last published release's page content.
 *                   Pass `null` for the very first publish (no previous).
 * @param next     - The draft being published.
 */
export function diffPages(previous: Page | null, next: Page): PageDiff {
  // First publish — everything is "added", treat as minor
  if (!previous) {
    const changes: PageDiffChange[] = next.sections.map((s) => ({
      kind: 'section-added' as const,
      sectionId: s.id,
      sectionType: s.type,
    }));
    return { isIdentical: false, changes };
  }

  // Fast path: hash comparison avoids full structural diff for unchanged content
  const prevHash = hashPageContent(previous);
  const nextHash = hashPageContent(next);
  if (prevHash === nextHash) {
    return { isIdentical: true, changes: [] };
  }

  const changes: PageDiffChange[] = [];

  // ── Page-level fields ─────────────────────────────────────────────────────
  if (previous.title !== next.title) {
    changes.push({
      kind: 'page-title-changed',
      from: previous.title,
      to: next.title,
    });
  }

  // ── Build lookup maps keyed by section ID ─────────────────────────────────
  const prevById = new Map<string, Section>(
    previous.sections.map((s) => [s.id, s]),
  );
  const nextById = new Map<string, Section>(
    next.sections.map((s) => [s.id, s]),
  );

  // ── Removed sections (in previous, not in next) ───────────────────────────
  for (const [id, section] of prevById) {
    if (!nextById.has(id)) {
      changes.push({
        kind: 'section-removed',
        sectionId: id,
        sectionType: section.type,
      });
    }
  }

  // ── Added sections (in next, not in previous) ─────────────────────────────
  for (const [id, section] of nextById) {
    if (!prevById.has(id)) {
      changes.push({
        kind: 'section-added',
        sectionId: id,
        sectionType: section.type,
      });
    }
  }

  // ── Sections present in both — check for mutations ────────────────────────
  for (const [id, prevSection] of prevById) {
    const nextSection = nextById.get(id);
    if (!nextSection) continue; // already recorded as removed

    // Type change (e.g. hero → cta) — breaking
    if (prevSection.type !== nextSection.type) {
      changes.push({
        kind: 'section-type-changed',
        sectionId: id,
        from: prevSection.type,
        to: nextSection.type,
      });
      // Don't also diff props when the type changed — the whole section is new
      continue;
    }

    // Prop changes
    const propChanges = diffProps(prevSection.props, nextSection.props);
    if (propChanges.length > 0) {
      changes.push({
        kind: 'section-props-changed',
        sectionId: id,
        sectionType: nextSection.type,
        changedKeys: propChanges,
      });
    }
  }

  // ── Section reordering ────────────────────────────────────────────────────
  // Only check sections that exist in both snapshots (not added/removed ones)
  const sharedIds = next.sections
    .map((s) => s.id)
    .filter((id) => prevById.has(id));

  const prevOrder = previous.sections
    .map((s) => s.id)
    .filter((id) => nextById.has(id));

  if (!arraysEqual(sharedIds, prevOrder)) {
    // Record a reorder change for each section whose position changed
    for (let i = 0; i < sharedIds.length; i++) {
      const id = sharedIds[i]!;
      const prevIndex = prevOrder.indexOf(id);
      if (prevIndex !== i) {
        changes.push({
          kind: 'section-reordered',
          sectionId: id,
          fromIndex: prevIndex,
          toIndex: i,
        });
      }
    }
  }

  return { isIdentical: false, changes };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return the list of top-level prop keys that changed between two prop objects.
 *
 * Deep comparison: nested objects and arrays are compared by JSON serialisation.
 * This is intentionally simple — a full structural diff of arbitrary JSON
 * would be complex and the changelog only needs key names, not nested paths.
 */
function diffProps(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  for (const key of allKeys) {
    const prevVal = prev[key];
    const nextVal = next[key];
    if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) {
      changed.push(key);
    }
  }

  return changed.sort(); // sort for determinism
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
