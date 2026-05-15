/**
 * Application-wide constants.
 *
 * Rules:
 *  - No logic here — pure data only.
 *  - Values that differ per environment belong in env.ts, not here.
 *  - Group related constants into named objects for tree-shaking friendliness.
 */

// ─── App metadata ────────────────────────────────────────────────────────────

export const APP_NAME = 'Page Studio' as const;
export const APP_DESCRIPTION =
  'Schema-driven landing page builder powered by Contentful CMS.' as const;

// ─── Routing ─────────────────────────────────────────────────────────────────

export const ROUTES = {
  home: '/',
  studio: '/studio',
  page: (slug: string) => `/pages/${slug}`,
  preview: (slug: string) => `/preview/${slug}`,
} as const;

export const API_ROUTES = {
  publish: '/api/publish',
  previewEnable: '/api/preview',
  previewDisable: '/api/preview/disable',
} as const;

// ─── CMS ─────────────────────────────────────────────────────────────────────

export const CMS = {
  /** Contentful content type IDs */
  contentTypes: {
    page: 'page',
    section: 'section',
  },
  /** Max entries fetched in a single request */
  maxEntries: 1000,
  /**
   * Depth of linked entry resolution.
   * 2 = resolve Page → Section entries.
   * Increase only if sections themselves link to other entries.
   */
  includeDepth: 2 as const,
} as const;

// ─── Versioning ───────────────────────────────────────────────────────────────

export const SEMVER = {
  initial: '0.1.0',
} as const;

// ─── Section types ────────────────────────────────────────────────────────────

export const SECTION_TYPES = [
  'hero',
  'featureGrid',
  'testimonial',
  'cta',
] as const;

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export const ROLES = ['viewer', 'editor', 'publisher'] as const;

// ─── UI ───────────────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;
