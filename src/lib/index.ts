/**
 * lib barrel export — domain utilities.
 *
 * These are framework-agnostic, pure TypeScript utilities tied to the
 * application domain (validation, versioning, result handling).
 *
 * Contrast with `utils/` which contains generic helpers with no domain
 * knowledge (array manipulation, string formatting, etc.).
 */
export { cn } from './cn';
export { ok, err, mapResult } from './result';
export type { Result } from './result';
export { validate, assertValid, formatZodError, zodIssues } from './validate';
export {
  parseSemVer,
  formatSemVer,
  bumpVersion,
  compareVersions,
  latestVersion,
  determineBumpType,
} from './semver';
export type { SemVer, BumpType } from './semver';
export { buildReleaseId } from './releaseId';
export { env, publicEnv } from './env';
export { renderSection } from './renderSection';
