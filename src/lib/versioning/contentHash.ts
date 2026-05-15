/**
 * Content hashing for idempotency detection.
 *
 * Purpose: produce a deterministic fingerprint of a Page's content so the
 * publish service can detect when the same draft is submitted twice and
 * avoid creating a duplicate release.
 *
 * Algorithm: SHA-256 over a canonical JSON representation.
 *
 * Canonical JSON rules (order matters for determinism):
 *   1. Page fields are serialised in a fixed key order.
 *   2. Sections are serialised in their array order (order is significant).
 *   3. Section props keys are sorted alphabetically so `{b:1,a:2}` and
 *      `{a:2,b:1}` produce the same hash.
 *   4. The `publishedAt` and `publishedBy` fields are excluded — they differ
 *      between publishes of identical content and must not affect the hash.
 *
 * Runtime: Node.js only (uses `crypto` from Node stdlib).
 * This function is called inside Route Handlers, never in edge middleware.
 */

import { createHash } from 'crypto';
import type { Page } from '@/types/page';

/**
 * Recursively sort object keys for deterministic JSON serialisation.
 * Arrays preserve their order — only object keys are sorted.
 */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Produce a canonical JSON string for a Page.
 * Only content-bearing fields are included — metadata (publishedAt, etc.)
 * is excluded so the hash reflects content, not publish circumstances.
 */
export function canonicalPageJson(page: Page): string {
  const canonical = {
    pageId: page.pageId,
    slug: page.slug,
    title: page.title,
    sections: page.sections.map((s) => ({
      id: s.id,
      type: s.type,
      props: sortKeys(s.props),
    })),
  };
  return JSON.stringify(canonical);
}

/**
 * Compute a SHA-256 hex digest of the page's canonical content.
 *
 * Two calls with content-identical pages always return the same string.
 * Any change to pageId, slug, title, section order, section types, or
 * any prop value will produce a different hash.
 */
export function hashPageContent(page: Page): string {
  return createHash('sha256').update(canonicalPageJson(page)).digest('hex');
}
