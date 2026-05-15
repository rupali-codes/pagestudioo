/**
 * String utilities.
 * Pure functions — no side effects, no imports from the app.
 */

/** Convert a string to URL-safe kebab-case. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Truncate a string to maxLength, appending an ellipsis if truncated. */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, maxLength - 1)}…`;
}

/** Capitalise the first letter of a string. */
export function capitalise(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}
