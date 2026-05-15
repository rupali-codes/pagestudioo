'use client';

/**
 * StudioShell — legacy shell for the /studio index route.
 *
 * This shell is shown at /studio when no slug is selected. It seeds the
 * demo page into draftPageSlice (not the old pageSlice) so the SectionList,
 * EditorSidebar, and PageRenderer all read from the same Redux slice.
 *
 * For the full slug-based editor, see /studio/[slug]/SlugStudioShell.tsx.
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { loadDraft, hydrateDraft } from '@/store/slices/draftPageSlice';
import { selectDraft, selectUser, selectDraftRestored } from '@/store/selectors';
import {
  setDraftRestored,
  clearDraftRestored,
} from '@/store/slices/uiSlice';
import { loadPersistedDraft } from '@/store/persistMiddleware';
import { DEMO_PAGE } from '@/lib/demoPage';
import { StudioToolbar } from '@/components/studio/StudioToolbar';
import { EditorSidebar } from '@/components/studio/EditorSidebar';
import { ReleaseHistory } from '@/components/studio/ReleaseHistory';
import { DiscardDialog } from '@/components/studio/DiscardDialog';
import { PageRenderer } from '@/components/page/PageRenderer';
import { PageErrorBoundary } from '@/components/page/PageErrorBoundary';

export function StudioShell() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraft);
  const user = useAppSelector(selectUser);
  const draftRestored = useAppSelector(selectDraftRestored);

  // Auto-dismiss "Draft restored" banner after 3 seconds
  useEffect(() => {
    if (!draftRestored) return;
    const timer = setTimeout(() => dispatch(clearDraftRestored()), 3000);
    return () => clearTimeout(timer);
  }, [draftRestored, dispatch]);

  useEffect(() => {
    // Read persisted draft into local variable before dispatching loadDraft,
    // so middleware side effects cannot overwrite the saved data.
    const persisted = loadPersistedDraft(DEMO_PAGE.pageId);

    dispatch(loadDraft(DEMO_PAGE));

    if (persisted) {
      dispatch(hydrateDraft(persisted));
      dispatch(setDraftRestored());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [dispatch, user]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      <StudioToolbar pageTitle={DEMO_PAGE.title} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: section list + editor panels */}
        <aside
          aria-label="Section editor"
          className="shrink-0 overflow-hidden border-r border-gray-200 bg-white"
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
