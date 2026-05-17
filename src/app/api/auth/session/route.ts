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
import { z } from 'zod';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { buildSessionCookie, buildMockSession } from '@/lib/auth/session';

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
      { error: 'Invalid role', valid: ['viewer', 'editor', 'publisher'] },
      { status: 422 },
    );
  }

  const session = buildMockSession(parsed.data.role);
  const cookie = buildSessionCookie(session);

  // Set the cookie on the response directly, not via cookies().set():
  // cookies().set() may not reliably propagate Set-Cookie headers when
  // returning a fresh NextResponse.json() on Vercel's serverless runtime.
  const response = NextResponse.json({ session }, { status: 200 });
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.options.httpOnly as boolean | undefined,
    secure: cookie.options.secure as boolean | undefined,
    sameSite: cookie.options.sameSite as 'lax' | 'strict' | 'none' | undefined,
    path: cookie.options.path as string | undefined,
    maxAge: cookie.options.maxAge as number | undefined,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
