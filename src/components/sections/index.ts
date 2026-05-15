/**
 * Section components barrel export.
 *
 * The registry imports directly from individual files (to avoid circular
 * dependencies). This barrel is for consumers outside the registry — e.g.
 * Storybook, tests, or the Studio component picker.
 */
export { HeroSection } from './HeroSection';
export { FeatureGridSection } from './FeatureGridSection';
export { TestimonialSection } from './TestimonialSection';
export { CtaSection } from './CtaSection';
export { UnsupportedSection } from './UnsupportedSection';
