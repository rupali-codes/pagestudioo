/**
 * Schemas barrel export.
 *
 * Consumers outside the schemas folder should import from here.
 * This keeps internal schema organisation flexible — files can be split or
 * merged without changing import paths across the codebase.
 */
export { SectionTypeSchema, SectionSchema } from './section';
export type { SectionInput, SectionOutput } from './section';

export { PageSchema, PageReleaseSchema } from './page';
export type { PageInput, PageReleaseInput } from './page';

export * from './props/index';
