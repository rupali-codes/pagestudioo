/**
 * Auth constants shared between Node.js runtime (session.ts) and
 * Edge runtime (edgeSession.ts, middleware.ts).
 *
 * This file must have ZERO imports — it runs in both runtimes.
 */
export const SESSION_COOKIE = 'page-studio-session' as const;
