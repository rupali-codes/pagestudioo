'use client';

import { useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { selectDraft, selectUser } from '@store/selectors';
import {
  startPublish,
  publishSuccess,
  publishFailure,
} from '@store/slices/publishSlice';
import { addRelease } from '@store/slices/releaseSlice';
import { markClean } from '@store/slices/draftPageSlice';
import { clearPersistedDraft } from '@store/persistMiddleware';
import { API_ROUTES } from '@constants';
import type { PageRelease } from '@/types/page';
import type { PublishStatus } from '@/lib/versioning/publishService';

interface PublishResponse {
  status: PublishStatus;
  release: PageRelease;
  bumpType: 'major' | 'minor' | 'patch' | null;
}

/**
 * Encapsulates the publish flow for the draft editor.
 *
 * Sends only the page to the server — version calculation, changelog, and
 * snapshot persistence all happen server-side in the publish service.
 *
 * Uses a ref to guard against duplicate concurrent publishes. Even though
 * `startPublish()` sets `isPublishing = true` in Redux synchronously, React
 * 18+ batching may delay the component re-render that reads the new state,
 * allowing a second click to bypass the `!isPublishing` check. The ref is
 * checked before any dispatch and is set synchronously outside React's
 * batching, preventing this race.
 *
 * On success (new release or noop):
 *   - Adds the release to `releaseSlice` (history)
 *   - Stores it in `publishSlice` (last published)
 *   - Marks the draft clean
 *   - Clears the localStorage draft
 */
export function usePublishDraft() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraft);
  const user = useAppSelector(selectUser);
  const isPublishingRef = useRef(false);

  const publish = useCallback(async () => {
    if (!draft || !user || isPublishingRef.current) return;

    isPublishingRef.current = true;
    dispatch(startPublish());

    try {
      const response = await fetch(API_ROUTES.publish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: draft }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? `Publish failed (${response.status})`);
      }

      const data = (await response.json()) as PublishResponse;
      dispatch(publishSuccess(data.release));
      dispatch(addRelease(data.release));
      dispatch(markClean());
      clearPersistedDraft(draft.pageId);
    } catch (e) {
      dispatch(
        publishFailure(e instanceof Error ? e.message : 'Publish failed'),
      );
    } finally {
      isPublishingRef.current = false;
    }
  }, [dispatch, draft, user]);

  return { publish };
}
