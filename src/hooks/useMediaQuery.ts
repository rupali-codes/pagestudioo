'use client';

import { useSyncExternalStore } from 'react';

/**
 * Returns true when the given CSS media query matches.
 *
 * Uses `useSyncExternalStore` for tear-free, SSR-safe subscriptions.
 * Returns `false` on the server and during hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };

  const getSnapshot = () => window.matchMedia(query).matches;

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
