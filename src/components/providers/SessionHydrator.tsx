'use client';

/**
 * SessionHydrator — renders nothing, just runs useSessionHydration on mount.
 *
 * Extracted into its own component so AppProviders stays a clean composition
 * root and the hydration side-effect is isolated and easy to find.
 */

import { useSessionHydration } from '@/hooks/useSessionHydration';

export function SessionHydrator() {
  useSessionHydration();
  return null;
}
