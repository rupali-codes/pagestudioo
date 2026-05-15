/**
 * POST /api/auth/session — set a mock session cookie.
 * DELETE /api/auth/session — clear the session cookie (logout).
 *
 * This is a simplified mock auth endpoint. In production, replace with
 * a real identity provider (NextAuth, Auth0, Clerk, etc.).
 *
 * The role is validated server-side — the client cannot set an arbitrary
 * role by crafting a request, because the cookie is HttpOnly and signed.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { buildSessionCookie, buildMockSession, SESSION_COOKIE } from '@/lib/auth/session';

const SetSessionSchema = z.object({
  role: z.enum(['viewer', 'editor', 'publisher']),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SetSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid role', valid: ['viewer', 'editor', 'publisher', 'admin'] },
      { status: 422 },
    );
  }

  const session = buildMockSession(parsed.data.role);
  const cookie = buildSessionCookie(session);

  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.options as Parameters<typeof cookieStore.set>[2]);

  return NextResponse.json({ session }, { status: 200 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true }, { status: 200 });
}
