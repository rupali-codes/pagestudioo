import { z } from 'zod';

export const HeroPropsSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().optional(),
});

export type HeroProps = z.output<typeof HeroPropsSchema>;
