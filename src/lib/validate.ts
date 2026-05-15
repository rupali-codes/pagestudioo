import { z } from 'zod';
import { ok, err, type Result } from './result';

// ─── Safe parse (Result-based) ────────────────────────────────────────────────

/**
 * Wraps Zod `safeParse` in a `Result<T, ZodError>` so callers never need
 * try/catch. Use this in components and anywhere a validation failure should
 * be handled gracefully rather than thrown.
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, z.ZodError> {
  const parsed = schema.safeParse(data);
  if (parsed.success) return ok(parsed.data);
  return err(parsed.error);
}

// ─── Throwing parse (server-side) ────────────────────────────────────────────

/**
 * Parses `data` against `schema` and returns the typed value, or throws a
 * descriptive `Error` on failure.
 *
 * Use this in server-side data-fetching paths (CMS mappers, API routes) where
 * a validation failure is a programming error that should surface immediately,
 * not be silently swallowed.
 */
export function assertValid<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error(
    `Schema validation failed:\n${formatZodError(parsed.error)}`,
  );
}

// ─── Error formatting ─────────────────────────────────────────────────────────

/**
 * Converts a ZodError into a flat, human-readable string.
 * Useful for logging and dev-mode UI messages.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join('\n');
}

/**
 * Extracts a flat list of human-readable issue strings from a ZodError.
 * Used by the renderer to pass structured error info to fallback UI.
 */
export function zodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
}
