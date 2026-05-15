/**
 * Default props factory for new sections.
 *
 * When a user adds a section, we need sensible placeholder content so the
 * preview renders something meaningful rather than a validation error.
 *
 * These defaults must satisfy the corresponding Zod schema's required fields.
 * They are intentionally minimal — just enough to pass validation.
 *
 * This is a pure utility with no Redux or React dependencies.
 */

import type { SectionType } from '@/types/page';

export function getDefaultSectionProps(
  type: SectionType,
): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return {
        heading: 'New Hero Section',
        subheading: 'Add a subheading here.',
        ctaLabel: 'Get started',
        ctaHref: '#',
      };

    case 'featureGrid':
      return {
        heading: 'Features',
        features: [
          {
            id: crypto.randomUUID(),
            icon: '✨',
            title: 'Feature title',
            description: 'Describe this feature.',
          },
        ],
      };

    case 'testimonial':
      return {
        heading: 'What people say',
        testimonials: [
          {
            id: crypto.randomUUID(),
            quote: 'Add a testimonial quote here.',
            author: 'Author Name',
            role: 'Title, Company',
          },
        ],
      };

    case 'cta':
      return {
        heading: 'Ready to get started?',
        body: 'Add a supporting sentence here.',
        primaryLabel: 'Get started',
        primaryHref: '#',
      };
  }
}
