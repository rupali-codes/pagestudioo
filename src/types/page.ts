/**
 * Domain types for pages and sections.
 * These are the canonical shapes used throughout the application.
 * CMS adapters are responsible for mapping raw CMS data to these types.
 */

export type SectionType = 'hero' | 'featureGrid' | 'testimonial' | 'cta';

export interface Section {
  id: string;
  type: SectionType;
  props: Record<string, unknown>;
}

export interface Page {
  pageId: string;
  slug: string;
  title: string;
  sections: Section[];
}

/** A versioned, immutable snapshot of a page */
export interface PageRelease {
  releaseId: string;
  version: string; // semver e.g. "1.2.0"
  pageId: string;
  slug: string;
  title: string;
  sections: Section[];
  publishedAt: string; // ISO 8601
  publishedBy: string; // user id
}
