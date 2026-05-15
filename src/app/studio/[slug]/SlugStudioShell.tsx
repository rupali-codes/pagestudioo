'use client';

/**
 * SlugStudioShell — the full editor UI for /studio/[slug].
 *
 * Mount sequence:
 *   1. Reads persisted draft from localStorage into a local variable FIRST.
 *   2. Dispatches `loadDraft(page)` to set the original CMS baseline.
 *   3. If a persisted draft exists, dispatches `hydrateDraft` to restore it.
 *
 * The local-variable-first approach is critical: the middleware used to
 * overwrite localStorage during `loadDraft`, making the subsequent
 * `loadPersistedDraft` read return the CMS baseline instead of the user's
 * saved draft. By reading into a variable before any dispatch, the data is
 * safe in memory regardless of middleware side effects.
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
import { selectDraft, selectDraftRestored } from '@/store/selectors';
import {
  setDraftRestored,
  clearDraftRestored,
} from '@/store/slices/uiSlice';
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
  const draftRestored = useAppSelector(selectDraftRestored);

  // Auto-dismiss "Draft restored" banner after 3 seconds
  useEffect(() => {
    if (!draftRestored) return;
    const timer = setTimeout(() => dispatch(clearDraftRestored()), 3000);
    return () => clearTimeout(timer);
  }, [draftRestored, dispatch]);

  useEffect(() => {
    // 1. Read persisted draft into a local variable BEFORE dispatching.
    //    This makes the data immune to middleware side effects during loadDraft.
    const persisted = loadPersistedDraft(page.pageId);

    // 2. Set the CMS baseline (present + original)
    dispatch(loadDraft(page));

    // 3. Restore any persisted draft edits from a previous session
    if (persisted) {
      dispatch(hydrateDraft(persisted));
      dispatch(setDraftRestored());
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
          className="relative flex-1 overflow-y-auto"
        >
          {/* "Draft restored" notification */}
          {draftRestored && (
            <div
              role="status"
              aria-live="polite"
              className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800"
            >
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
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Draft restored
            </div>
          )}

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
