'use client';

/**
 * RoleSwitcher — development-only widget for simulating different roles.
 *
 * Renders a floating pill in the bottom-right corner. Clicking a role
 * calls POST /api/auth/session, updates the cookie, and refreshes the page
 * so Server Components re-render with the new session.
 *
 * Hidden in production (NODE_ENV check at render time).
 * Accessible: each role button has an aria-label and the current role is
 * indicated with aria-pressed.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { selectUser } from '@/store/selectors';
import { MOCK_USERS } from '@/types/auth';
import type { Role } from '@/types/auth';
import { cn } from '@/lib/cn';

const ROLES: Role[] = ['viewer', 'editor', 'publisher'];

const ROLE_COLORS: Record<Role, string> = {
  viewer:    'bg-gray-100 text-gray-700 hover:bg-gray-200',
  editor:    'bg-blue-100 text-blue-700 hover:bg-blue-200',
  publisher: 'bg-green-100 text-green-700 hover:bg-green-200',
};

const ACTIVE_COLORS: Record<Role, string> = {
  viewer:    'bg-gray-700 text-white',
  editor:    'bg-blue-600 text-white',
  publisher: 'bg-green-600 text-white',
};

export function RoleSwitcher() {
  // Never render in production
  if (process.env.NODE_ENV === 'production') return null;

  return <RoleSwitcherInner />;
}

function RoleSwitcherInner() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [isLoading, setIsLoading] = useState<Role | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentRole = user?.role ?? null;

  async function switchRole(role: Role) {
    if (role === currentRole || isLoading) return;
    setIsLoading(role);

    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      // Update Redux immediately for instant UI feedback
      dispatch(setUser(MOCK_USERS[role]));

      // Refresh Server Components so guards re-evaluate with the new cookie
      router.refresh();
    } finally {
      setIsLoading(null);
      setIsExpanded(false);
    }
  }

  async function signOut() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    dispatch(setUser(null));
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      aria-label="Developer role switcher"
    >
      {/* Role buttons — shown when expanded */}
      {isExpanded && (
        <div
          className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
          role="group"
          aria-label="Switch role"
        >
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => switchRole(role)}
              disabled={isLoading !== null}
              aria-pressed={role === currentRole}
              aria-label={`Switch to ${role} role`}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                'disabled:cursor-wait disabled:opacity-60',
                role === currentRole
                  ? ACTIVE_COLORS[role]
                  : ROLE_COLORS[role],
              )}
            >
              {isLoading === role ? '…' : role}
              {role === currentRole && (
                <span className="ml-1.5 opacity-75">✓</span>
              )}
            </button>
          ))}

          <hr className="my-1 border-gray-100" />

          <button
            type="button"
            onClick={signOut}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Toggle pill */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-label="Toggle role switcher"
        className={cn(
          'flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-md',
          'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          'transition-colors',
        )}
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            currentRole ? ACTIVE_COLORS[currentRole].split(' ')[0] : 'bg-gray-300',
          )}
          aria-hidden="true"
        />
        <span className="capitalize text-gray-700">{currentRole ?? 'Not signed in'}</span>
        <span aria-hidden="true" className="text-gray-800">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>
    </div>
  );
}
