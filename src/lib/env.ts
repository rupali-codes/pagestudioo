/**
 * Typed environment variable access.
 *
 * Why: `process.env.FOO` returns `string | undefined`. Accessing env vars
 * through this module gives a typed, validated value and a clear error
 * message when something is missing — instead of a silent undefined that
 * surfaces as a runtime crash deep in the call stack.
 *
 * Rules:
 *   - `env.*` — server-only. Never import in Client Components or browser code.
 *   - `publicEnv.*` — safe anywhere. Values are inlined at build time by Next.js.
 *   - All accessors are functions (not plain values) so they're evaluated lazily.
 *     This means the module can be imported without throwing in environments
 *     where credentials aren't set (e.g. during `next build` with stub vars).
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Copy .env.local.example to .env.local and fill in the value.\n` +
        `See README.md for setup instructions.`,
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

// ─── Server-side env (CMS adapter, API routes only) ──────────────────────────

export const env = {
  contentful: {
    /** Contentful Space ID — required */
    spaceId: () => requireEnv('CONTENTFUL_SPACE_ID'),

    /** Delivery API token — read-only, published content */
    accessToken: () => requireEnv('CONTENTFUL_ACCESS_TOKEN'),

    /** Preview API token — read-only, draft + published content */
    previewToken: () => requireEnv('CONTENTFUL_PREVIEW_TOKEN'),

    /**
     * Secret used to authenticate the /api/preview webhook from Contentful.
     * Must match the value configured in Contentful's preview URL.
     */
    previewSecret: () => requireEnv('CONTENTFUL_PREVIEW_SECRET'),

    /**
     * Contentful Environment ID — defaults to 'master'.
     * Set CONTENTFUL_ENVIRONMENT=staging to point at a staging environment.
     */
    environment: () => optionalEnv('CONTENTFUL_ENVIRONMENT', 'master'),
  },
} as const;

// ─── Public env (safe in Client Components) ───────────────────────────────────

export const publicEnv = {
  /** Full URL of the deployed app — used for absolute links and OG tags */
  appUrl: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
} as const;
