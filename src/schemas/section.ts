import { z } from 'zod';

export const SectionTypeSchema = z.enum([
  'hero',
  'featureGrid',
  'testimonial',
  'cta',
]);

export const SectionSchema = z.object({
  id: z.string().min(1),
  type: SectionTypeSchema,
  props: z.record(z.string(), z.unknown()),
});

export type SectionInput = z.input<typeof SectionSchema>;
export type SectionOutput = z.output<typeof SectionSchema>;
