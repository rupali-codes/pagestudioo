/**
 * lib barrel export — domain utilities.
 *
 * Framework-agnostic, pure TypeScript utilities tied to the application domain.
 * Contrast with `utils/` which contains generic helpers (array, string, etc.).
 *
 * Versioning utilities are in `@/lib/versioning` — import from there directly
 * to keep the import explicit about which subsystem you're using.
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
} from './semver';
export type { SemVer, BumpType } from './semver';
export { buildReleaseId } from './releaseId';
export { env, publicEnv } from './env';
export { renderSection } from './renderSection';
export { getDefaultSectionProps } from './defaultSectionProps';
export { DEMO_PAGE, DEMO_SLUG } from './demoPage';
