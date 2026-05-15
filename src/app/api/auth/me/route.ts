/**
 * GET /api/auth/me — return the current session.
 *
 * Used by the client to hydrate Redux auth state on mount.
 * Returns 401 if no session exists (not an error — just unauthenticated).
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { MOCK_USERS } from '@/types/auth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Build the full User object from the session role
  const user = MOCK_USERS[session.role];

  return NextResponse.json({ user, session }, { status: 200 });
}
