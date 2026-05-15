/**
 * Edge-compatible session reader.
 *
 * Next.js middleware runs in the Edge Runtime which does NOT have access to:
 *   - Node.js `crypto` module (use Web Crypto API instead)
 *   - `next/headers` cookies() helper
 *
 * This module re-implements session decoding using only Web APIs so it can
 * run in middleware. It must stay in sync with the signing logic in session.ts.
 */

import type { NextRequest } from 'next/server';
import type { Role, Session } from '@/types/auth';
import { SESSION_COOKIE } from './constants';

// ─── Web Crypto signing (edge-compatible) ─────────────────────────────────────

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function verifySignature(
  payload: string,
  sig: string,
  secret: string,
): Promise<boolean> {
  try {
    const key = await getKey(secret);
    const enc = new TextEncoder();

    // Convert hex signature back to bytes
    const sigBytes = new Uint8Array(
      sig.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
    );

    return crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
  } catch {
    return false;
  }
}

// ─── Decode ───────────────────────────────────────────────────────────────────

async function decodeEdge(token: string, secret: string): Promise<Session | null> {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const valid = await verifySignature(payload, sig, secret);
  if (!valid) return null;

  try {
    // base64url decode
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Session;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Read and verify the session from a middleware request.
 * Returns null if no session exists or the cookie is invalid.
 */
export async function getEdgeSession(request: NextRequest): Promise<Session | null> {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const secret = process.env.SESSION_SECRET ?? 'dev-secret-change-in-production';
  return decodeEdge(raw, secret);
}

/**
 * Extract just the role from the session cookie without full verification.
 * Used for fast routing decisions where a tampered role would be caught
 * by the server-side guard anyway.
 *
 * Returns null if the cookie is missing or malformed.
 */
export function getRoleFromCookie(request: NextRequest): Role | null {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const dot = raw.lastIndexOf('.');
  if (dot === -1) return null;

  try {
    const payload = raw.slice(0, dot);
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const session = JSON.parse(json) as Partial<Session>;
    const role = session.role;
    if (!role || !['viewer', 'editor', 'publisher'].includes(role)) {
      return null;
    }
    return role as Role;
  } catch {
    return null;
  }
}
