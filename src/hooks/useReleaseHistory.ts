'use client';

/**
 * useReleaseHistory — loads the release history for a page slug from the
 * server and populates the Redux release slice.
 *
 * Called once when the studio editor mounts for a given slug. After that,
 * new releases are added to Redux directly by usePublishDraft on success,
 * so the UI stays in sync without re-fetching.
 *
 * Loading state is derived from whether the slug has been fetched at least
 * once, avoiding synchronous setState calls in the effect body.
 */

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setReleases } from '@/store/slices/releaseSlice';
import type { PageRelease } from '@/types/page';

interface UseReleaseHistoryResult {
  isLoading: boolean;
  error: string | null;
}

export function useReleaseHistory(slug: string): UseReleaseHistoryResult {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);

  const isLoading = loadedSlug !== slug && slug.length > 0;

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/releases/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          return;
        }
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? `Failed to load releases (${res.status})`);
        }
        const data = (await res.json()) as { releases: PageRelease[] };
        dispatch(setReleases(data.releases));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load releases');
      })
      .finally(() => {
        setLoadedSlug(slug);
      });
  }, [slug, dispatch]);

  return { isLoading, error };
}
