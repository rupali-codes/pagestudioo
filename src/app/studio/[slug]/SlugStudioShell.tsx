'use client';

/**
 * SlugStudioShell — the full editor UI for /studio/[slug].
 *
 * Mount sequence:
 *   1. Receives the CMS page as a prop (fetched server-side).
 *   2. Dispatches `loadDraft(page)` to set the original baseline.
 *   3. Checks localStorage for a persisted draft for this pageId.
 *   4. If a draft exists, dispatches `hydrateDraft` to restore it.
 *   5. SessionHydrator (in AppProviders) populates Redux auth from the
 *      server session cookie — no manual user seeding needed here.
 *
 * Layout: three-column
 *   ┌──────────────┬──────────────────────────┬──────────────┐
 *   │ EditorSidebar│     Live Preview          │ ReleaseHistory│
 *   │  (280px)     │     (flex-1)              │  (240px)     │
 *   └──────────────┴──────────────────────────┴──────────────┘
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadDraft, hydrateDraft } from '@/store/slices/draftPageSlice';
import { selectDraft } from '@/store/selectors';
import { loadPersistedDraft } from '@/store/persistMiddleware';
import { PageRenderer } from '@/components/page/PageRenderer';
import { PageErrorBoundary } from '@/components/page/PageErrorBoundary';
import { StudioToolbar } from '@/components/studio/StudioToolbar';
import { EditorSidebar } from '@/components/studio/EditorSidebar';
import { ReleaseHistory } from '@/components/studio/ReleaseHistory';
import { DiscardDialog } from '@/components/studio/DiscardDialog';
import type { Page } from '@/types/page';

interface SlugStudioShellProps {
  page: Page;
}

export function SlugStudioShell({ page }: SlugStudioShellProps) {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraft);

  useEffect(() => {
    // Load the CMS page as the original baseline
    dispatch(loadDraft(page));

    // Restore any persisted draft edits from a previous session
    const persisted = loadPersistedDraft(page.pageId);
    if (persisted) {
      dispatch(hydrateDraft(persisted));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.pageId]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      <StudioToolbar pageTitle={page.title} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: section list + editor panels */}
        <aside
          aria-label="Section editor"
          className="flex shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white"
          style={{ width: '280px' }}
        >
          <EditorSidebar />
        </aside>

        {/* Centre: live preview */}
        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Page preview"
          className="flex-1 overflow-y-auto"
        >
          {draft ? (
            <PageErrorBoundary>
              <div className="min-h-full bg-white shadow-sm">
                <PageRenderer page={draft} isPreview />
              </div>
            </PageErrorBoundary>
          ) : (
            <div
              className="flex h-full items-center justify-center text-sm text-gray-400"
              aria-live="polite"
            >
              Loading preview…
            </div>
          )}
        </main>

        {/* Right: release history */}
        <aside
          aria-label="Release history"
          className="w-60 shrink-0 overflow-y-auto border-l border-gray-200 bg-white"
        >
          <ReleaseHistory />
        </aside>
      </div>

      <DiscardDialog />
    </div>
  );
}
