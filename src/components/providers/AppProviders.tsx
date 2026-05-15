'use client';

/**
 * AppProviders composes all client-side context providers into a single tree.
 *
 * Why a single wrapper:
 *  - The root layout stays a Server Component (no 'use client' needed there).
 *  - Adding a new provider means editing one file, not the layout.
 *  - Provider order is explicit and documented in one place.
 *
 * Provider order (outermost → innermost):
 *  1. ReduxProvider  — state must be available to everything below
 *  (add more here as the app grows, e.g. ThemeProvider, AuthProvider)
 */

import type { ReactNode } from 'react';
import { ReduxProvider } from './ReduxProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <ReduxProvider>{children}</ReduxProvider>;
}
