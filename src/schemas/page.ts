import { z } from 'zod';
import { SectionSchema } from './section';

export const PageSchema = z.object({
  pageId: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-/]+$/, 'Slug must be URL-safe'),
  title: z.string().min(1),
  sections: z.array(SectionSchema),
});

export const PageReleaseSchema = PageSchema.extend({
  releaseId: z.string().min(1),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g. 1.2.0)'),
  publishedAt: z.string().datetime(),
  publishedBy: z.string().min(1),
});

export type PageInput = z.input<typeof PageSchema>;
export type PageReleaseInput = z.input<typeof PageReleaseSchema>;
