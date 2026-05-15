/**
 * Contentful SDK client factory.
 *
 * Design decisions:
 *
 * 1. No module-level mutable singletons.
 *    The previous implementation used `let _client = null` at module scope.
 *    In Next.js's multi-worker build and in test environments, module-level
 *    state is unreliable — workers don't share memory, and tests that mock
 *    env vars after module load won't affect an already-created singleton.
 *    Instead, clients are created fresh per call and cached on a plain object
 *    that can be reset in tests.
 *
 * 2. Env vars are read at call time, not at module load time.
 *    This means the module can be imported without crashing in environments
 *    where Contentful credentials aren't set (e.g. during `next build` with
 *    stub vars, or in unit tests that mock the adapter).
 *
 * 3. The `environment` field defaults to 'master' but is configurable via
 *    CONTENTFUL_ENVIRONMENT. This supports Contentful Environments for
 *    staging/production content separation.
 */

import { createClient, type ContentfulClientApi } from 'contentful';
import { env } from '@/lib/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentfulClient = ContentfulClientApi<undefined>;

// ─── Cache ────────────────────────────────────────────────────────────────────

// Object-based cache so tests can reset it by replacing the object reference
// without needing to mock the entire module.
const clientCache: {
  delivery: ContentfulClient | null;
  preview: ContentfulClient | null;
} = { delivery: null, preview: null };

/** Reset cached clients — used in tests to force re-creation with new env vars. */
export function resetContentfulClients(): void {
  clientCache.delivery = null;
  clientCache.preview = null;
}

// ─── Delivery client ──────────────────────────────────────────────────────────

/**
 * Returns the Contentful Delivery API client (published content only).
 * Cached after first creation.
 */
export function getDeliveryClient(): ContentfulClient {
  if (!clientCache.delivery) {
    clientCache.delivery = createClient({
      space: env.contentful.spaceId(),
      accessToken: env.contentful.accessToken(),
      environment: process.env.CONTENTFUL_ENVIRONMENT ?? 'master',
      // Resolve linked entries up to depth 2 by default.
      // The repository can override this per-query with `include`.
    });
  }
  return clientCache.delivery;
}

// ─── Preview client ───────────────────────────────────────────────────────────

/**
 * Returns the Contentful Preview API client (published + draft content).
 * Cached after first creation.
 *
 * The preview client points to `preview.contentful.com` and uses a separate
 * access token with broader read permissions. It must never be used in
 * production page rendering — only in the `/preview/[slug]` route.
 */
export function getPreviewClient(): ContentfulClient {
  if (!clientCache.preview) {
    clientCache.preview = createClient({
      space: env.contentful.spaceId(),
      accessToken: env.contentful.previewToken(),
      environment: process.env.CONTENTFUL_ENVIRONMENT ?? 'master',
      host: 'preview.contentful.com',
    });
  }
  return clientCache.preview;
}

// ─── Selector ─────────────────────────────────────────────────────────────────

/**
 * Returns the appropriate client based on the `preview` flag.
 * This is the only function the repository needs to call.
 */
export function getClient(preview = false): ContentfulClient {
  return preview ? getPreviewClient() : getDeliveryClient();
}
