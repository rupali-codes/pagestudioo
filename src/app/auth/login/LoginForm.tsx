'use client';

/**
 * LoginForm — mock role selector.
 *
 * In production this would be a real credential form or an OAuth redirect.
 * Here it calls POST /api/auth/session with the selected role, which sets
 * a signed HttpOnly cookie, then redirects to the callback URL.
 *
 * Accessibility:
 *  - Role options are radio buttons in a fieldset with a legend.
 *  - Submit button shows loading state with aria-busy.
 *  - Errors are announced via role="alert".
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { MOCK_USERS } from '@/types/auth';
import type { Role } from '@/types/auth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  viewer:    'Read-only access to published pages and previews.',
  editor:    'Access to the studio editor. Cannot publish.',
  publisher: 'Full editor access plus the ability to publish releases.',
  admin:     'All permissions including user management.',
};

interface LoginFormProps {
  callbackUrl: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selectedRole, setSelectedRole] = useState<Role>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!res.ok) {
        throw new Error('Failed to create session');
      }

      // Hydrate Redux with the user so the UI updates immediately
      dispatch(setUser(MOCK_USERS[selectedRole]));

      // Navigate to the intended destination
      router.push(callbackUrl);
      router.refresh(); // re-run Server Components with the new cookie
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setIsLoading(false);
    }
  }

  const roles: Role[] = ['viewer', 'editor', 'publisher', 'admin'];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <fieldset className="mb-6">
        <legend className="mb-3 text-sm font-semibold text-gray-700">
          Select a role to sign in as
        </legend>

        <div className="space-y-2">
          {roles.map((role) => (
            <label
              key={role}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                selectedRole === role
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50',
              )}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <p className="text-sm font-medium capitalize text-gray-900">
                  {role}
                </p>
                <p className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? 'Signing in…' : `Sign in as ${selectedRole}`}
      </Button>

      <p className="mt-4 text-center text-xs text-gray-400">
        This is a mock auth system for demonstration purposes.
      </p>
    </form>
  );
}
