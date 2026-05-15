/**
 * Contentful implementation of `CmsAdapter`.
 *
 * This is the only file that imports from `contentfulClient.ts` and
 * `mappers.ts`. Routes and hooks import from this file only — they never
 * touch the Contentful SDK directly.
 *
 * All methods return `Result<T>` and never throw. Errors are either:
 *   - Network / SDK errors  → caught in try/catch, wrapped in `err()`
 *   - Validation failures   → returned from mappers as null, converted to `err()`
 *   - Not-found             → explicit `err()` with a descriptive message
 */

import type { CmsAdapter, FetchPageOptions } from './cmsAdapter';
import type { Page } from '@/types/page';
import type { Result } from '@/lib/result';
import { ok, err } from '@/lib/result';
import { getClient } from './contentfulClient';
import { mapPage } from './mappers';
import type { ContentfulPageSkeleton } from './contentfulTypes';
import { CMS } from '@/constants';

// ─── Fetch page by slug ───────────────────────────────────────────────────────

/**
 * Fetch a single page by its URL slug.
 *
 * Uses `getEntries` with a slug filter rather than `getEntry` by ID because
 * slugs are the stable public identifier — Contentful entry IDs are internal
 * and should not appear in URLs.
 *
 * `include: 2` resolves linked Section entries one level deep. Increasing
 * this would resolve entries nested inside sections, but our current content
 * model doesn't need that.
 */
export async function fetchPageBySlug(
  slug: string,
  options: FetchPageOptions = {},
): Promise<Result<Page>> {
  try {
    const client = getClient(options.preview);

    const response = await client.getEntries<ContentfulPageSkeleton>({
      content_type: CMS.contentTypes.page,
      'fields.slug': slug,
      include: CMS.includeDepth,
      limit: 1,
    });

    if (response.items.length === 0) {
      return err(
        new Error(
          `Page not found: slug="${slug}" ` +
            `(${options.preview ? 'preview' : 'delivery'} API)`,
        ),
      );
    }

    // `items[0]` is safe here — we just checked `length > 0`
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const entry = response.items[0]!;
    const page = mapPage(entry);

    if (!page) {
      return err(
        new Error(
          `Page "${slug}" (entry: ${entry.sys.id}) failed schema validation. ` +
            `Check the server logs for details.`,
        ),
      );
    }

    return ok(page);
  } catch (e) {
    return err(wrapError(e, `fetchPageBySlug("${slug}")`));
  }
}

// ─── Fetch all slugs ──────────────────────────────────────────────────────────

/**
 * Fetch all published page slugs for `generateStaticParams`.
 *
 * Uses `select` to fetch only the `fields.slug` field — avoids pulling full
 * page content (including all linked sections) for every page just to get
 * a list of slugs.
 *
 * Note: `select` in the Contentful SDK v11 accepts an array of field paths.
 * `sys` is always included automatically.
 */
export async function fetchAllSlugs(
  options: FetchPageOptions = {},
): Promise<Result<string[]>> {
  try {
    const client = getClient(options.preview);

    const response = await client.getEntries<ContentfulPageSkeleton>({
      content_type: CMS.contentTypes.page,
      // Select only the slug field — no need to resolve linked sections
      select: ['fields.slug'],
      limit: CMS.maxEntries,
    });

    const slugs = response.items
      .map((entry) => entry.fields.slug)
      // Filter out any entries where slug is somehow missing (shouldn't happen
      // with a required field, but the type allows it)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0);

    return ok(slugs);
  } catch (e) {
    return err(wrapError(e, 'fetchAllSlugs()'));
  }
}

// ─── Adapter export ───────────────────────────────────────────────────────────

/**
 * The concrete Contentful adapter, typed against the `CmsAdapter` interface.
 *
 * Routes import this object rather than the individual functions so that:
 *   1. The import site is explicit about which adapter is in use.
 *   2. Swapping adapters is a one-line change here, not a change in every route.
 *   3. Tests can replace this with a mock adapter without touching the SDK.
 */
export const contentfulAdapter: CmsAdapter = {
  fetchPageBySlug,
  fetchAllSlugs,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wrap an unknown thrown value in a descriptive Error.
 * Contentful SDK errors have a `message` and sometimes a `status` field.
 */
function wrapError(e: unknown, context: string): Error {
  if (e instanceof Error) {
    // Preserve the original message but add context
    const wrapped = new Error(`[CMS] ${context}: ${e.message}`);
    wrapped.cause = e;
    return wrapped;
  }
  return new Error(`[CMS] ${context}: ${String(e)}`);
}
