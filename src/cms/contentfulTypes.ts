/**
 * Contentful SDK skeleton type definitions.
 *
 * The Contentful JS SDK v10+ uses a generic `EntrySkeletonType` to give
 * `entry.fields` a precise type instead of `Record<string, unknown>`.
 * Defining skeletons here means every `entry.fields.foo` access is typed
 * and checked at compile time — no more `as Record<string, unknown>` casts.
 *
 * These types live in `src/cms/` and are NEVER imported outside this folder.
 * The rest of the app only sees the domain types in `src/types/`.
 */

import type { EntryFieldTypes, EntrySkeletonType } from 'contentful';

// ─── Section skeleton ─────────────────────────────────────────────────────────

/**
 * Mirrors the "Section" content type in Contentful.
 *
 * Contentful content model:
 *   Field ID      | Field type  | Notes
 *   ------------- | ----------- | ------------------------------------
 *   sectionType   | Short text  | Validated enum: hero|featureGrid|…
 *   props         | JSON object | Arbitrary section-specific props
 */
export interface ContentfulSectionSkeleton extends EntrySkeletonType {
  contentTypeId: 'section';
  fields: {
    sectionType: EntryFieldTypes.Symbol;
    // JSON object field — Contentful returns this as a plain JS object.
    // We use `EntryFieldTypes.Object` without a type parameter so it accepts
    // any JSON-compatible value; the Zod schema validates the actual shape.
    props: EntryFieldTypes.Object;
  };
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

/**
 * Mirrors the "Page" content type in Contentful.
 *
 * Contentful content model:
 *   Field ID  | Field type        | Notes
 *   --------- | ----------------- | ------------------------------------
 *   slug      | Short text        | Unique, URL-safe identifier
 *   title     | Short text        | Page <title> and h1
 *   sections  | References (many) | Linked Section entries, resolved at depth 2
 */
export interface ContentfulPageSkeleton extends EntrySkeletonType {
  contentTypeId: 'page';
  fields: {
    slug: EntryFieldTypes.Symbol;
    title: EntryFieldTypes.Symbol;
    // Array of linked Section entries — resolved by the SDK at include depth 2
    sections: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<ContentfulSectionSkeleton>
    >;
  };
}
