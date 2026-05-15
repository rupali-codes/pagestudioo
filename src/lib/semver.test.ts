import { describe, it, expect } from 'vitest';
import {
  parseSemVer,
  formatSemVer,
  bumpVersion,
  compareVersions,
  latestVersion,
} from './semver';

describe('parseSemVer', () => {
  it('parses valid semver', () => {
    expect(parseSemVer('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });
  it('throws on invalid input', () => {
    expect(() => parseSemVer('1.2')).toThrow();
    expect(() => parseSemVer('abc')).toThrow();
  });
});

describe('formatSemVer', () => {
  it('formats correctly', () => {
    expect(formatSemVer({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
  });
});

describe('bumpVersion', () => {
  it('bumps patch', () => expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4'));
  it('bumps minor and resets patch', () => expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0'));
  it('bumps major and resets minor+patch', () => expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0'));
});

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => expect(compareVersions('1.2.3', '1.2.3')).toBe(0));
  it('returns positive when a > b', () => expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0));
  it('returns negative when a < b', () => expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0));
});

describe('latestVersion', () => {
  it('returns null for empty array', () => expect(latestVersion([])).toBeNull());
  it('returns the highest version', () => {
    expect(latestVersion(['1.0.0', '2.0.0', '1.5.0'])).toBe('2.0.0');
  });
});
