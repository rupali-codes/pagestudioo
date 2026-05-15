/**
 * Core semver primitives — parse, format, compare, bump.
 *
 * These are low-level utilities with no knowledge of page structure.
 * The versioning system's diff-driven bump logic lives in:
 *   src/lib/versioning/semverCalculator.ts
 *
 * `determineBumpType` (the old type-set comparison) has been removed.
 * It was replaced by the full diff engine which handles:
 *   - section removal / type change  → major
 *   - section addition               → minor
 *   - prop changes / reorder / title → patch
 */

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemVer(version: string): SemVer {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (
    !match ||
    match[1] === undefined ||
    match[2] === undefined ||
    match[3] === undefined
  ) {
    throw new Error(`Invalid semver: "${version}"`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

export function formatSemVer({ major, minor, patch }: SemVer): string {
  return `${major}.${minor}.${patch}`;
}

export type BumpType = 'major' | 'minor' | 'patch';

export function bumpVersion(current: string, type: BumpType): string {
  const v = parseSemVer(current);
  switch (type) {
    case 'major':
      return formatSemVer({ major: v.major + 1, minor: 0, patch: 0 });
    case 'minor':
      return formatSemVer({ major: v.major, minor: v.minor + 1, patch: 0 });
    case 'patch':
      return formatSemVer({
        major: v.major,
        minor: v.minor,
        patch: v.patch + 1,
      });
  }
}

export function compareVersions(a: string, b: string): number {
  const va = parseSemVer(a);
  const vb = parseSemVer(b);
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

export function latestVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;
  return [...versions].sort(compareVersions).at(-1) ?? null;
}
