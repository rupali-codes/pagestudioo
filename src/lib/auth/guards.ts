/**
 * Server-side permission guards.
 *
 * These functions are called inside Server Components and Route Handlers.
 * They read the session, check permissions, and either return the session
 * or respond with the appropriate HTTP error.
 *
 * Why separate from middleware?
 *   Next.js middleware runs at the edge and cannot use Node.js APIs (crypto,
 *   cookies from next/headers, etc.). Guards run in the Node.js runtime
 *   inside Route Handlers and Server Components, where full APIs are available.
 *   Middleware handles coarse-grained routing; guards handle fine-grained
 *   per-endpoint checks with access to the full request context.
 */

import { redirect } from 'next/navigation';
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from './session';
import { hasPermission, type Permission, type Session } from '@/types/auth';

// ─── Server Component guards ──────────────────────────────────────────────────

/**
 * Require a valid session in a Server Component.
 * Redirects to /auth/login if no session exists.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect('/auth/login');
  }
  return session;
}

/**
 * Require a specific permission in a Server Component.
 * Redirects to /auth/unauthorized if the session lacks the permission.
 */
export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session.role, permission)) {
    redirect('/auth/unauthorized');
  }
  return session;
}

// ─── Route Handler guards ─────────────────────────────────────────────────────

/**
 * Verify a session in a Route Handler.
 * Returns a 401 JSON response if no session exists.
 * Returns a 403 JSON response if the session lacks the required permission.
 *
 * Usage:
 *   const guard = await guardApiRoute(request, 'page:publish');
 *   if (guard.error) return guard.error;
 *   const { session } = guard;
 */
export async function guardApiRoute(
  _request: NextRequest,
  permission: Permission,
): Promise<
  | { error: NextResponse; session: null }
  | { error: null; session: Session }
> {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 },
      ),
      session: null,
    };
  }

  if (!hasPermission(session.role, permission)) {
    return {
      error: NextResponse.json(
        {
          error: `Permission denied: requires "${permission}"`,
          code: 'FORBIDDEN',
          role: session.role,
        },
        { status: 403 },
      ),
      session: null,
    };
  }

  return { error: null, session };
}
