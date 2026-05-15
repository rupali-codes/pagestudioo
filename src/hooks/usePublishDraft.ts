'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  selectDraft,
  selectUser,
  selectLatestRelease,
} from '@store/selectors';
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

/**
 * Encapsulates the publish flow for the draft editor.
 *
 * On success:
 *   - Adds the new release to `releaseSlice` (history)
 *   - Stores it in `publishSlice` (last published)
 *   - Marks the draft clean
 *   - Clears the localStorage draft (published = no longer a draft)
 */
export function usePublishDraft() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraft);
  const user = useAppSelector(selectUser);
  const latestRelease = useAppSelector(selectLatestRelease);

  const publish = useCallback(async () => {
    if (!draft || !user) return;

    dispatch(startPublish());

    try {
      const response = await fetch(API_ROUTES.publish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: draft,
          publishedBy: user.id,
          previousVersion: latestRelease?.version,
          previousSectionTypes: latestRelease?.sections.map((s) => s.type),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? `Publish failed (${response.status})`);
      }

      const data = (await response.json()) as { release: PageRelease };
      dispatch(publishSuccess(data.release));
      dispatch(addRelease(data.release));
      dispatch(markClean());
      clearPersistedDraft(draft.pageId);
    } catch (e) {
      dispatch(
        publishFailure(e instanceof Error ? e.message : 'Publish failed'),
      );
    }
  }, [dispatch, draft, user, latestRelease]);

  return { publish };
}
