/**
 * Auth utilities barrel export.
 *
 * Server Components / Route Handlers: import from here.
 * Middleware: import from './edgeSession' directly (edge runtime constraints).
 */
export { getSession, buildSessionCookie, buildMockSession, SESSION_COOKIE } from './session';
export { requireSession, requirePermission, guardApiRoute } from './guards';
