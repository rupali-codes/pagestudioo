/**
 * CMS adapter barrel export.
 *
 * The rest of the application imports from '@cms' — never from deep paths
 * inside this folder. This keeps the adapter internals private and makes
 * future CMS swaps a change inside this folder only.
 *
 * What IS exported:
 *   - The adapter interface (for typing mock adapters in tests)
 *   - The concrete adapter instance (for use in routes)
 *   - Fetch option types (for route function signatures)
 *
 * What is NOT exported:
 *   - Contentful client factories (internal implementation detail)
 *   - Skeleton types (Contentful-specific, not part of the public API)
 *   - Mapper functions (internal transformation detail)
 */
export type { CmsAdapter, FetchPageOptions } from './cmsAdapter';
export { contentfulAdapter } from './pageRepository';
