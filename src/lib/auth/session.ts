/**
 * Server-side session management.
 *
 * Implementation: signed cookie containing a JSON payload.
 *
 * Why not JWT / OAuth?
 *   The requirement is mock auth — a cookie with a role value is sufficient
 *   to demonstrate server-side enforcement without OAuth infrastructure.
 *
 * Security model:
 *   - The cookie is HttpOnly (JS cannot read it) and SameSite=Lax.
 *   - The payload is HMAC-signed with SESSION_SECRET to prevent tampering.
 *   - In production, replace the signing logic with a proper JWT library
 *     (e.g. jose) and a real identity provider.
 *
 * Cookie name: page-studio-session
 * Payload:     base64(JSON) + "." + HMAC-SHA256(base64(JSON), secret)
 */

import { cookies } from 'next/headers';
import { createHmac } from 'crypto';
import type { Role, Session } from '@/types/auth';

import { SESSION_COOKIE } from './constants';
export { SESSION_COOKIE };

/** Max age: 7 days in seconds */
const MAX_AGE = 60 * 60 * 24 * 7;

// ─── Signing ──────────────────────────────────────────────────────────────────

function getSecret(): string {
  // Falls back to a dev-only secret so the app works without configuration.
  // In production, SESSION_SECRET must be set to a strong random value.
  return process.env.SESSION_SECRET ?? 'dev-secret-change-in-production';
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function encode(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decode(token: string): Session | null {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // Constant-time comparison to prevent timing attacks
  const expected = sign(payload);
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
  } catch {
    return null;
  }
}

/** Constant-time string comparison — prevents timing side-channel attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Read and verify the session from the request cookie store.
 * Returns null if no session exists or the cookie has been tampered with.
 *
 * Server Components and Route Handlers only — uses next/headers.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
}

/**
 * Write a session cookie.
 * Called by POST /api/auth/session after validating credentials.
 */
export function buildSessionCookie(session: Session): {
  name: string;
  value: string;
  options: Record<string, unknown>;
} {
  return {
    name: SESSION_COOKIE,
    value: encode(session),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE,
    },
  };
}

/**
 * Build a mock session for a given role.
 * Used by the /api/auth/session endpoint in development.
 */
export function buildMockSession(role: Role): Session {
  const ids: Record<Role, string> = {
    viewer:    'mock-viewer',
    editor:    'mock-editor',
    publisher: 'mock-publisher',
  };
  const names: Record<Role, string> = {
    viewer:    'Alice Viewer',
    editor:    'Bob Editor',
    publisher: 'Carol Publisher',
  };
  return { userId: ids[role], role, name: names[role] };
}
