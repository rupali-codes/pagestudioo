import { z } from 'zod';

export const FeatureItemSchema = z.object({
  id: z.string(),
  icon: z.string().optional(),
  title: z.string().min(1),
  description: z.string(),
});

export const FeatureGridPropsSchema = z.object({
  heading: z.string().optional(),
  features: z.array(FeatureItemSchema).min(1),
});

export type FeatureGridProps = z.output<typeof FeatureGridPropsSchema>;
export type FeatureItem = z.output<typeof FeatureItemSchema>;
