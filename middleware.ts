/**
 * Next.js Edge Middleware — coarse-grained route protection.
 *
 * Runs before every matched request, at the edge, before any Server Component
 * or Route Handler executes. This is the first line of defence.
 *
 * What middleware does:
 *   - Reads the role from the session cookie (fast, no crypto verification)
 *   - Redirects unauthenticated users to /auth/login
 *   - Redirects users without sufficient role to /auth/unauthorized
 *
 * What middleware does NOT do:
 *   - Cryptographically verify the session (too slow for edge; done in guards)
 *   - Make database calls
 *   - Handle fine-grained per-resource permissions
 *
 * The server-side guards in src/lib/auth/guards.ts perform full verification
 * inside Route Handlers and Server Components. Middleware + guards = defence
 * in depth: even if middleware is bypassed, the guard catches it.
 *
 * Route policy:
 *   /studio/*   → requires 'editor' role or above (page:edit permission)
 *   /api/publish → requires 'publisher' role or above (page:publish permission)
 *   /preview/*  → requires any authenticated session (page:read)
 *   /auth/*     → always public (login/logout pages)
 *   everything else → public
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getRoleFromCookie } from '@/lib/auth/edgeSession';
import { hasPermission, ROUTE_PERMISSIONS, type Role } from '@/types/auth';

export const config = {
  matcher: [
    '/studio/:path*',
    '/api/publish',
    '/preview/:path*',
  ],
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determine required permission for this route
  const requiredPermission = getRequiredPermission(pathname);
  if (!requiredPermission) return NextResponse.next();

  // Fast role extraction (no crypto — full verification happens in guards)
  const role = getRoleFromCookie(request);

  // No session → redirect to login, preserving the intended destination
  if (!role) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists but role lacks permission → redirect to unauthorized
  if (!hasPermission(role as Role, requiredPermission)) {
    const unauthorizedUrl = new URL('/auth/unauthorized', request.url);
    unauthorizedUrl.searchParams.set('required', requiredPermission);
    unauthorizedUrl.searchParams.set('role', role);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Attach role to request headers so Server Components can read it without
  // re-parsing the cookie (avoids a second cookie read per request)
  const response = NextResponse.next();
  response.headers.set('x-user-role', role);
  return response;
}

// ─── Route → permission mapping ───────────────────────────────────────────────

function getRequiredPermission(
  pathname: string,
): (typeof ROUTE_PERMISSIONS)[keyof typeof ROUTE_PERMISSIONS] | null {
  if (pathname.startsWith('/studio')) return ROUTE_PERMISSIONS.studio;
  if (pathname.startsWith('/api/publish')) return ROUTE_PERMISSIONS.publish;
  if (pathname.startsWith('/preview')) return ROUTE_PERMISSIONS.preview;
  return null;
}
