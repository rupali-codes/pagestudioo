'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { setPage } from '@/store/slices/pageSlice';
import { selectCurrentPage, selectUser } from '@/store/selectors';
import { StudioToolbar } from '@/components/studio/StudioToolbar';
import { SectionList } from '@/components/studio/SectionList';
import { ReleaseHistory } from '@/components/studio/ReleaseHistory';
import { PageRenderer } from '@/components/page/PageRenderer';
import { PageErrorBoundary } from '@/components/page/PageErrorBoundary';
import type { Page } from '@/types/page';

/** Demo page used when no CMS is configured */
const DEMO_PAGE: Page = {
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

export function StudioShell() {
  const dispatch = useAppDispatch();
  const page = useAppSelector(selectCurrentPage);
  const user = useAppSelector(selectUser);

  // Seed demo data on mount
  useEffect(() => {
    if (!user) {
      dispatch(
        setUser({
          id: 'demo-user',
          name: 'Demo Editor',
          email: 'editor@example.com',
          role: 'publisher',
        }),
      );
    }
    if (!page) {
      dispatch(setPage(DEMO_PAGE));
    }
  }, [dispatch, user, page]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <StudioToolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: section editor */}
        <aside
          aria-label="Section editor"
          className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white"
        >
          <h2 className="border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Sections
          </h2>
          <SectionList />
        </aside>

        {/* Center: live preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {page ? (
            <PageErrorBoundary>
              <PageRenderer page={page} isPreview />
            </PageErrorBoundary>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Loading page…
            </div>
          )}
        </div>

        {/* Right sidebar: release history */}
        <aside
          aria-label="Release history"
          className="w-64 shrink-0 overflow-y-auto border-l border-gray-200 bg-white"
        >
          <ReleaseHistory />
        </aside>
      </div>
    </div>
  );
}
