import { z } from 'zod';

export const TestimonialItemSchema = z.object({
  id: z.string(),
  quote: z.string().min(1),
  author: z.string().min(1),
  role: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  avatarAlt: z.string().optional(),
});

export const TestimonialPropsSchema = z.object({
  heading: z.string().optional(),
  testimonials: z.array(TestimonialItemSchema).min(1),
});

export type TestimonialProps = z.output<typeof TestimonialPropsSchema>;
export type TestimonialItem = z.output<typeof TestimonialItemSchema>;
