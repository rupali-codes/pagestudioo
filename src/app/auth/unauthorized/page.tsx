import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Access denied — Page Studio' };

interface UnauthorizedPageProps {
  searchParams: Promise<{ required?: string; role?: string }>;
}

export default async function UnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  const { required, role } = await searchParams;
  const session = await getSession();

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-white px-6"
    >
      <div className="mx-auto max-w-sm text-center">
        {/* Lock icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg
            aria-hidden="true"
            className="h-7 w-7 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Access denied</h1>

        {session ? (
          <>
            <p className="text-sm text-gray-500">
              Signed in as{' '}
              <strong className="font-semibold capitalize text-gray-700">
                {role ?? session.role}
              </strong>
              {' — '}this page requires{' '}
              <strong className="font-semibold text-gray-700">
                {required ?? 'a higher'}
              </strong>{' '}
              permission.
            </p>

            {(role === 'viewer' || session.role === 'viewer') ? (
              <p className="mt-4 text-sm text-gray-500">
                As a viewer, you can view published pages instead.
              </p>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Try switching to a role with the required permission.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">You need to sign in to access this page.</p>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          {session && (role === 'viewer' || session.role === 'viewer') ? (
            <Link
              href="/pages/home"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              View published pages
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {session ? 'Switch role' : 'Sign in'}
            </Link>
          )}
          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
