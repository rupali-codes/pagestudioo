'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the given CSS media query matches.
 *
 * SSR-safe: returns `false` on the server and during hydration,
 * then syncs to the real value after mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
