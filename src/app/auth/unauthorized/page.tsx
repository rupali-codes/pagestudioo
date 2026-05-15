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
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
    >
      {/* Lock icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
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

      <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>

      <p className="max-w-sm text-sm text-gray-600">
        {session ? (
          <>
            You&apos;re signed in as{' '}
            <strong className="font-semibold capitalize">{role ?? session.role}</strong>{' '}
            but this page requires the{' '}
            <strong className="font-semibold">{required ?? 'higher'}</strong>{' '}
            permission.
          </>
        ) : (
          'You need to sign in to access this page.'
        )}
      </p>

      <div className="flex gap-3">
        <Link
          href="/auth/login"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {session ? 'Switch role' : 'Sign in'}
        </Link>
        <Link
          href="/"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
