'use client';

/**
 * AppProviders — composes all client-side context providers.
 *
 * Also handles session hydration: on mount, fetches /api/auth/me and
 * populates Redux auth state so every component sees the correct user
 * without individual fetch calls.
 *
 * Provider order (outermost → innermost):
 *   1. ReduxProvider  — state must be available to SessionHydrator below
 */

import type { ReactNode } from 'react';
import { ReduxProvider } from './ReduxProvider';
import { SessionHydrator } from './SessionHydrator';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider>
      {/* SessionHydrator runs inside ReduxProvider so it can dispatch */}
      <SessionHydrator />
      {children}
    </ReduxProvider>
  );
}
