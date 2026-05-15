/**
 * Demo page — used when no Contentful credentials are configured.
 *
 * Exported as a constant so both the /studio route (server-side bypass)
 * and the legacy StudioShell (client-side seed) use identical data.
 *
 * The pageId 'demo-page' is stable so localStorage draft persistence works
 * correctly across reloads: the key `page-studio:draft:demo-page` is always
 * the same regardless of how the demo is accessed.
 */

import type { Page } from '@/types/page';

export const DEMO_PAGE: Page = {
  pageId: 'demo-page',
  slug: 'demo',
  title: 'Demo Page',
  sections: [
    {
      id: 'hero-1',
      type: 'hero',
      props: {
        heading: 'Welcome to Page Studio',
        subheading: 'Build schema-driven landing pages with Contentful CMS.',
        ctaLabel: 'Get started',
        ctaHref: '#features',
      },
    },
    {
      id: 'features-1',
      type: 'featureGrid',
      props: {
        heading: 'Features',
        features: [
          {
            id: 'f1',
            icon: '🧩',
            title: 'Schema-driven',
            description: 'Every section is validated against a Zod schema.',
          },
          {
            id: 'f2',
            icon: '🔒',
            title: 'Role-based access',
            description: 'Viewers, editors, publishers, and admins.',
          },
          {
            id: 'f3',
            icon: '🚀',
            title: 'Versioned releases',
            description: 'Immutable semver snapshots on every publish.',
          },
        ],
      },
    },
    {
      id: 'cta-1',
      type: 'cta',
      props: {
        heading: 'Ready to build?',
        body: 'Connect your Contentful space and start publishing.',
        primaryLabel: 'Read the docs',
        primaryHref: '/docs',
      },
    },
  ],
};

/** The slug that triggers demo mode — no CMS fetch is attempted. */
export const DEMO_SLUG = 'demo' as const;
