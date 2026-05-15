'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  selectCurrentPage,
  selectUser,
  selectLatestRelease,
} from '@store/selectors';
import {
  setPublishing,
  setError,
  addRelease,
} from '@store/slices/releaseSlice';
import { clearDirty } from '@store/slices/pageSlice';
import { API_ROUTES } from '@constants';
import type { PageRelease, Section } from '@/types/page';

/**
 * Encapsulates the publish flow: POST /api/publish → update Redux state.
 *
 * Keeping this logic in a hook (not a component) means the StudioToolbar
 * stays a pure presentational component and the flow is testable in isolation.
 */
export function usePublish() {
  const dispatch = useAppDispatch();
  const page = useAppSelector(selectCurrentPage);
  const user = useAppSelector(selectUser);
  const latestRelease = useAppSelector(selectLatestRelease);

  const publish = useCallback(async () => {
    if (!page || !user) return;

    dispatch(setPublishing(true));
    dispatch(setError(null));

    try {
      const response = await fetch(API_ROUTES.publish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          publishedBy: user.id,
          previousVersion: latestRelease?.version,
          previousSectionTypes: latestRelease?.sections.map((s: Section) => s.type),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? `Publish failed (${response.status})`);
      }

      const data = (await response.json()) as { release: PageRelease };
      dispatch(addRelease(data.release));
      dispatch(clearDirty());
    } catch (e) {
      dispatch(setError(e instanceof Error ? e.message : 'Publish failed'));
    } finally {
      dispatch(setPublishing(false));
    }
  }, [dispatch, page, user, latestRelease]);

  return { publish };
}
