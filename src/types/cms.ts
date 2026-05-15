/**
 * CMS-agnostic types used at the adapter boundary.
 *
 * These are NOT Contentful types — they describe the shape of data that any
 * CMS adapter must produce before it reaches the domain layer.
 *
 * Contentful-specific skeleton types live in `src/cms/contentfulTypes.ts`
 * and are never imported outside that folder.
 */

/**
 * Options accepted by any CMS adapter fetch method.
 * Re-exported here so callers don't need to import from the adapter directly.
 */
export interface CmsFetchOptions {
  /**
   * Fetch draft/unpublished content when true.
   * Adapters that don't support preview mode should ignore this flag.
   */
  preview?: boolean;
}

/**
 * Metadata returned alongside fetched content.
 * Useful for cache invalidation, debugging, and audit trails.
 */
export interface CmsEntryMeta {
  /** The CMS-internal entry ID (e.g. Contentful sys.id) */
  entryId: string;
  /** ISO 8601 timestamp of the last content update */
  updatedAt: string;
  /** The content type ID as defined in the CMS */
  contentTypeId: string;
}
