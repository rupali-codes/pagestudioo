/**
 * Contentful → domain type mappers.
 *
 * This is the only file in the codebase that knows about Contentful's data
 * shapes. Everything it returns is a plain domain type (`Page`, `Section`).
 *
 * Mapping strategy:
 *   - Each mapper returns `T | null` — null means "this entry is unusable".
 *   - Callers decide what to do with null (skip, log, surface an error).
 *   - Validation is done with Zod schemas, not manual type guards, so the
 *     error messages are precise and point to the exact failing field.
 *   - Linked entries that fail to resolve (unresolvable links) are skipped
 *     rather than crashing the page.
 */

import type { Entry, UnresolvedLink } from 'contentful';
import type { Page, Section } from '@/types/page';
import type {
  ContentfulPageSkeleton,
  ContentfulSectionSkeleton,
} from './contentfulTypes';
import { validate, formatZodError } from '@/lib/validate';
import { SectionSchema } from '@/schemas/section';
import { PageSchema } from '@/schemas/page';

// ─── Linked entry guard ───────────────────────────────────────────────────────

/**
 * Type guard that distinguishes a resolved Entry from an UnresolvedLink.
 *
 * When `include` depth is insufficient or a linked entry is deleted in
 * Contentful, the SDK returns an `UnresolvedLink` object instead of an
 * `Entry`. We must filter these out before mapping.
 *
 * We use `EntrySkeletonType` bound explicitly to satisfy the SDK's generic
 * constraint, and cast the result to the specific skeleton type after the
 * check — the runtime `sys.type` check is the actual guard.
 */
function isResolvedSectionEntry(
  item: Entry<ContentfulSectionSkeleton> | UnresolvedLink<'Entry'> | undefined,
): item is Entry<ContentfulSectionSkeleton> {
  // Resolved entries have `sys.type === 'Entry'`; unresolved links have
  // `sys.type === 'Link'`; undefined items are filtered out too.
  return item !== undefined && item.sys.type === 'Entry';
}

// ─── Section mapper ───────────────────────────────────────────────────────────

/**
 * Map a resolved Contentful Section entry to a domain `Section`.
 *
 * Returns null when:
 *   - The entry's `sectionType` is not a known SectionType enum value
 *   - The `props` field is missing or fails the base record schema
 *
 * Note: individual prop schemas (HeroPropsSchema etc.) are NOT validated here.
 * That validation happens in the renderer, so a section with invalid props
 * still appears in the page — it just renders a `SectionError` fallback
 * instead of the real component. This gives content authors a visible signal
 * rather than silently dropping the section.
 */
export function mapSection(
  entry: Entry<ContentfulSectionSkeleton>,
): Section | null {
  // `entry.fields` is now typed via the skeleton — no cast needed
  const { sectionType, props } = entry.fields;

  const raw = {
    id: entry.sys.id,
    type: sectionType,
    // `props` is typed as `JsonObject | JsonArray | null` from the SDK.
    // We coerce to `Record<string, unknown>` for our schema — the Zod
    // validator will reject non-object values cleanly.
    props: (props as Record<string, unknown> | null) ?? {},
  };

  const result = validate(SectionSchema, raw);

  if (!result.ok) {
    // Log with enough context to find the entry in Contentful
    console.warn(
      `[CMS] Section entry "${entry.sys.id}" (type: "${sectionType}") ` +
        `failed schema validation — skipping.\n` +
        formatZodError(result.error),
    );
    return null;
  }

  return result.value;
}

// ─── Page mapper ──────────────────────────────────────────────────────────────

/**
 * Map a resolved Contentful Page entry to a domain `Page`.
 *
 * Returns null when the page's own fields (slug, title) fail validation.
 * Individual invalid sections are filtered out rather than failing the page —
 * a page with one broken section is better than a 404.
 */
export function mapPage(
  entry: Entry<ContentfulPageSkeleton>,
): Page | null {
  const { slug, title, sections: rawSections } = entry.fields;

  // The SDK types `sections` as a complex union depending on chain modifiers.
  // At runtime with the default client (no chain modifiers), resolved linked
  // entries are `Entry<ContentfulSectionSkeleton>` objects. We cast to an
  // array and then use the type guard to filter safely.
  const sectionsArray = Array.isArray(rawSections)
    ? (rawSections as Array<
        Entry<ContentfulSectionSkeleton> | UnresolvedLink<'Entry'> | undefined
      >)
    : [];

  // Filter out unresolved links and undefined items, then map each section
  const sections = sectionsArray
    .filter(isResolvedSectionEntry)
    .map(mapSection)
    .filter((s): s is Section => s !== null);

  const raw = {
    pageId: entry.sys.id,
    slug,
    title,
    sections,
  };

  const result = validate(PageSchema, raw);

  if (!result.ok) {
    console.warn(
      `[CMS] Page entry "${entry.sys.id}" (slug: "${slug}") ` +
        `failed schema validation — skipping.\n` +
        formatZodError(result.error),
    );
    return null;
  }

  return result.value;
}
