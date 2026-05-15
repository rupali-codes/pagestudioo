import type { Page } from '@/types/page';
import { SectionRenderer } from './SectionRenderer';

interface PageRendererProps {
  page: Page;
  isPreview?: boolean;
}

/**
 * PageRenderer — iterates a page's section list and renders each one.
 *
 * Design decisions:
 *  - Each section is rendered independently via `SectionRenderer`. A failure
 *    in one section (invalid props, unregistered type, thrown error) does not
 *    affect its siblings.
 *  - `isPreview` is threaded through to every section so fallback components
 *    (`SectionError`, `UnsupportedSection`, `SectionErrorBoundary`) can show
 *    detailed diagnostic UI in preview mode even in production builds.
 *  - This is a Server Component — no 'use client'. The preview banner uses
 *    only static markup, no client interactivity needed.
 */
export function PageRenderer({ page, isPreview }: PageRendererProps) {
  return (
    <main id="main-content" tabIndex={-1}>
      {isPreview && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-yellow-400 px-4 py-2 text-sm font-semibold text-yellow-900"
        >
          {/* Eye icon */}
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Preview mode — changes are not published
        </div>
      )}

      {page.sections.length === 0 ? (
        <EmptySections isPreview={isPreview} />
      ) : (
        page.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            isPreview={isPreview}
          />
        ))
      )}
    </main>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptySections({ isPreview }: { isPreview?: boolean }) {
  if (!isPreview && process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-gray-400">
      <p className="text-sm">This page has no sections.</p>
      <p className="text-xs">Add sections in Contentful to see them here.</p>
    </div>
  );
}
