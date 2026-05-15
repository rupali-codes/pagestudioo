'use client';

/**
 * SlugStudioShell — the full editor UI for /studio/[slug].
 *
 * Mount sequence:
 *   1. Receives the CMS page as a prop (fetched server-side).
 *   2. Dispatches `loadDraft(page)` to set the original baseline.
 *   3. Checks localStorage for a persisted draft for this pageId.
 *   4. If a draft exists, dispatches `hydrateDraft` to restore it.
 *   5. Seeds a demo user if none is authenticated (dev convenience).
 *
 * Layout: three-column
 *   ┌──────────────┬──────────────────────────┬──────────────┐
 *   │ EditorSidebar│     Live Preview          │ ReleaseHistory│
 *   │  (280px)     │     (flex-1)              │  (240px)     │
 *   └──────────────┴──────────────────────────┴──────────────┘
 *
 * The preview reads from `draftPage.present` in Redux, so every edit
 * dispatched from the sidebar is immediately reflected in the preview
 * without any extra wiring.
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadDraft, hydrateDraft } from '@/store/slices/draftPageSlice';
import { setUser } from '@/store/slices/authSlice';
import { selectDraft, selectUser } from '@/store/selectors';
import { loadPersistedDraft } from '@/store/persistMiddleware';
import { PageRenderer } from '@/components/page/PageRenderer';
import { PageErrorBoundary } from '@/components/page/PageErrorBoundary';
import { StudioToolbar } from '@/components/studio/StudioToolbar';
import { EditorSidebar } from '@/components/studio/EditorSidebar';
import { ReleaseHistory } from '@/components/studio/ReleaseHistory';
import { DiscardDialog } from '@/components/studio/DiscardDialog';
import type { Page } from '@/types/page';

interface SlugStudioShellProps {
  /** The CMS-fetched page — used as the original baseline for the draft. */
  page: Page;
}

export function SlugStudioShell({ page }: SlugStudioShellProps) {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraft);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    // Step 1: load the CMS page as the original baseline
    dispatch(loadDraft(page));

    // Step 2: check for a persisted draft and hydrate if found
    const persisted = loadPersistedDraft(page.pageId);
    if (persisted) {
      dispatch(hydrateDraft(persisted));
    }

    // Step 3: seed a demo user if none is authenticated
    // In production this would be replaced by a real auth check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.pageId]); // only re-run when the page changes, not on every render

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
      {/* Top toolbar — full width */}
      <StudioToolbar pageTitle={page.title} />

      {/* Three-column editor layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Left: section list + editor panels */}
        <aside
          aria-label="Section editor"
          className="flex w-70 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white"
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
              {/* Scale the preview down slightly so it fits the panel */}
              <div className="min-h-full origin-top bg-white shadow-sm">
                <PageRenderer page={draft} isPreview />
              </div>
            </PageErrorBoundary>
          ) : (
            <div
              className="flex h-full items-center justify-center text-sm text-gray-400"
              aria-live="polite"
              aria-label="Loading page preview"
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

      {/* Discard confirmation dialog — rendered at root so it overlays everything */}
      <DiscardDialog />
    </div>
  );
}
