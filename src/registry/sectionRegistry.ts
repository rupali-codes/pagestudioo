import type { SectionRegistry } from '@/types/registry';

// Section components
import { HeroSection } from '@/components/sections/HeroSection';
import { FeatureGridSection } from '@/components/sections/FeatureGridSection';
import { TestimonialSection } from '@/components/sections/TestimonialSection';
import { CtaSection } from '@/components/sections/CtaSection';

// Prop schemas — co-located with their entry so the registry is the single
// source of truth for "what does this section type look like?"
import { HeroPropsSchema } from '@/schemas/props/hero';
import { FeatureGridPropsSchema } from '@/schemas/props/featureGrid';
import { TestimonialPropsSchema } from '@/schemas/props/testimonial';
import { CtaPropsSchema } from '@/schemas/props/cta';

/**
 * The section registry is the central dispatch table for the renderer.
 *
 * Each entry binds a section type to:
 *   - `component`   — the React component that renders it
 *   - `schema`      — the Zod schema that validates its props
 *   - `displayName` — human-readable label for Studio UI / error messages
 *
 * Why this shape instead of a plain `Record<SectionType, Component>`?
 *   1. The renderer can validate props *before* mounting the component,
 *      keeping validation logic out of every individual component.
 *   2. The Studio can enumerate all registered types with metadata without
 *      importing every component.
 *   3. Adding a new section type is a single object addition here — TypeScript
 *      will error if the new SectionType union member is not covered.
 */
export const sectionRegistry: SectionRegistry = {
  hero: {
    component: HeroSection,
    schema: HeroPropsSchema,
    displayName: 'Hero',
  },
  featureGrid: {
    component: FeatureGridSection,
    schema: FeatureGridPropsSchema,
    displayName: 'Feature Grid',
  },
  testimonial: {
    component: TestimonialSection,
    schema: TestimonialPropsSchema,
    displayName: 'Testimonial',
  },
  cta: {
    component: CtaSection,
    schema: CtaPropsSchema,
    displayName: 'Call to Action',
  },
};

/**
 * Look up a registry entry by section type string.
 *
 * Returns `undefined` for unknown types rather than throwing, so the renderer
 * can decide how to handle the gap (show fallback, log warning, etc.).
 * The `in` check is necessary because at runtime the type comes from CMS data
 * which may not match the compile-time union.
 */
export function getRegistryEntry(
  type: string,
): (typeof sectionRegistry)[keyof typeof sectionRegistry] | undefined {
  if (type in sectionRegistry) {
    return sectionRegistry[type as keyof typeof sectionRegistry];
  }
  return undefined;
}

/**
 * Look up a human-readable display name for a section type.
 *
 * Centralises the single source of truth from the registry so that UI
 * components (SectionListItem, AddSectionPanel) don't maintain their own
 * label maps. Falls back to the raw type string for unregistered types.
 */
export function getSectionDisplayName(type: string): string {
  const entry = getRegistryEntry(type);
  return entry?.displayName ?? type;
}
