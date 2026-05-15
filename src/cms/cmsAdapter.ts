/**
 * CMS adapter interface — the abstraction boundary between the application
 * and any specific CMS implementation.
 *
 * Why this exists:
 *   The rest of the application (routes, components, hooks) imports from
 *   `pageRepository.ts`, which in turn calls a `CmsAdapter`. Swapping
 *   Contentful for another CMS (Sanity, Prismic, a local JSON file) means
 *   implementing this interface and updating one import in `pageRepository.ts`.
 *   No route, component, or hook needs to change.
 *
 * Rules:
 *   - All methods return `Result<T>` — never throw, never return null.
 *   - All returned data must conform to domain types (`Page`, `Section`).
 *   - No Contentful-specific types may appear in this interface.
 */

import type { Page } from '@/types/page';
import type { Result } from '@/lib/result';

export interface FetchPageOptions {
  /**
   * When true, fetch from the Preview API (unpublished content).
   * When false or omitted, fetch from the Delivery API (published content).
   */
  preview?: boolean;
}

export interface CmsAdapter {
  /**
   * Fetch a single page by its URL slug.
   * Returns `err` if the page is not found or fails schema validation.
   */
  fetchPageBySlug(
    slug: string,
    options?: FetchPageOptions,
  ): Promise<Result<Page>>;

  /**
   * Fetch all published page slugs.
   * Used by Next.js `generateStaticParams` to pre-render all pages at build time.
   * Returns an empty array (not an error) if no pages exist.
   */
  fetchAllSlugs(options?: FetchPageOptions): Promise<Result<string[]>>;
}
