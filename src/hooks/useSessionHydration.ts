'use client';

/**
 * useSessionHydration — fetches the current session from /api/auth/me
 * and hydrates Redux auth state on mount.
 *
 * Called once in AppProviders so every page has the correct user in Redux
 * without each component needing to fetch it independently.
 *
 * Why fetch from the API instead of reading the cookie client-side?
 *   The session cookie is HttpOnly — JavaScript cannot read it. The /me
 *   endpoint is the safe bridge between the server session and client state.
 */

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import type { User } from '@/types/auth';

export function useSessionHydration() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ user: User | null }>;
      })
      .then((data) => {
        if (data?.user) {
          dispatch(setUser(data.user));
        }
      })
      .catch(() => {
        // Network error — leave Redux auth state as-is (null)
      });
  }, [dispatch]);
}
