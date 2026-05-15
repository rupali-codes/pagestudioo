import { z } from 'zod';

export const CtaPropsSchema = z.object({
  heading: z.string().min(1),
  body: z.string().optional(),
  primaryLabel: z.string().min(1),
  primaryHref: z.string(),
  secondaryLabel: z.string().optional(),
  secondaryHref: z.string().optional(),
});

export type CtaProps = z.output<typeof CtaPropsSchema>;
