/**
 * Props schemas barrel export.
 *
 * Import from here when you need multiple schemas, or from the individual
 * file when you only need one (better tree-shaking for large bundles).
 */
export { HeroPropsSchema } from './hero';
export type { HeroProps } from './hero';

export { FeatureGridPropsSchema, FeatureItemSchema } from './featureGrid';
export type { FeatureGridProps, FeatureItem } from './featureGrid';

export { TestimonialPropsSchema, TestimonialItemSchema } from './testimonial';
export type { TestimonialProps, TestimonialItem } from './testimonial';

export { CtaPropsSchema } from './cta';
export type { CtaProps } from './cta';
