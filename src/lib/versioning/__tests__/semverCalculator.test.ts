import { describe, it, expect } from 'vitest';
import {
  changeSeverity,
  highestSeverity,
  calculateNextVersion,
  ensureVersionIncrement,
} from '../semverCalculator';
import type { PageDiff, PageDiffChange } from '@/types/page';

// ─── changeSeverity ───────────────────────────────────────────────────────────

describe('changeSeverity', () => {
  it('section-removed → major', () => {
    const c: PageDiffChange = { kind: 'section-removed', sectionId: 'x', sectionType: 'hero' };
    expect(changeSeverity(c)).toBe('major');
  });

  it('section-type-changed → major', () => {
    const c: PageDiffChange = {
      kind: 'section-type-changed',
      sectionId: 'x',
      from: 'hero',
      to: 'cta',
    };
    expect(changeSeverity(c)).toBe('major');
  });

  it('section-added → minor', () => {
    const c: PageDiffChange = { kind: 'section-added', sectionId: 'x', sectionType: 'cta' };
    expect(changeSeverity(c)).toBe('minor');
  });

  it('section-props-changed → patch', () => {
    const c: PageDiffChange = {
      kind: 'section-props-changed',
      sectionId: 'x',
      sectionType: 'hero',
      changedKeys: ['heading'],
    };
    expect(changeSeverity(c)).toBe('patch');
  });

  it('section-reordered → patch', () => {
    const c: PageDiffChange = {
      kind: 'section-reordered',
      sectionId: 'x',
      fromIndex: 0,
      toIndex: 1,
    };
    expect(changeSeverity(c)).toBe('patch');
  });

  it('page-title-changed → patch', () => {
    const c: PageDiffChange = { kind: 'page-title-changed', from: 'A', to: 'B' };
    expect(changeSeverity(c)).toBe('patch');
  });
});

// ─── highestSeverity ──────────────────────────────────────────────────────────

describe('highestSeverity', () => {
  it('returns patch for empty array', () => {
    expect(highestSeverity([])).toBe('patch');
  });

  it('major beats minor and patch', () => {
    expect(highestSeverity(['patch', 'minor', 'major'])).toBe('major');
  });

  it('minor beats patch', () => {
    expect(highestSeverity(['patch', 'minor'])).toBe('minor');
  });

  it('single patch returns patch', () => {
    expect(highestSeverity(['patch'])).toBe('patch');
  });
});

// ─── calculateNextVersion ─────────────────────────────────────────────────────

describe('calculateNextVersion', () => {
  const identicalDiff: PageDiff = { isIdentical: true, changes: [] };
  const patchDiff: PageDiff = {
    isIdentical: false,
    changes: [{ kind: 'page-title-changed', from: 'A', to: 'B' }],
  };
  const minorDiff: PageDiff = {
    isIdentical: false,
    changes: [{ kind: 'section-added', sectionId: 'x', sectionType: 'cta' }],
  };
  const majorDiff: PageDiff = {
    isIdentical: false,
    changes: [{ kind: 'section-removed', sectionId: 'x', sectionType: 'hero' }],
  };

  it('first publish → 0.1.0 regardless of diff content', () => {
    const result = calculateNextVersion(patchDiff, null);
    expect(result.version).toBe('0.1.0');
    expect(result.isNoop).toBe(false);
  });

  it('identical diff with previous version → noop', () => {
    const result = calculateNextVersion(identicalDiff, '1.2.3');
    expect(result.isNoop).toBe(true);
    expect(result.version).toBe('1.2.3');
  });

  it('patch diff bumps patch', () => {
    const result = calculateNextVersion(patchDiff, '1.2.3');
    expect(result.version).toBe('1.2.4');
    expect(result.bumpType).toBe('patch');
  });

  it('minor diff bumps minor and resets patch', () => {
    const result = calculateNextVersion(minorDiff, '1.2.3');
    expect(result.version).toBe('1.3.0');
    expect(result.bumpType).toBe('minor');
  });

  it('major diff bumps major and resets minor+patch', () => {
    const result = calculateNextVersion(majorDiff, '1.2.3');
    expect(result.version).toBe('2.0.0');
    expect(result.bumpType).toBe('major');
  });

  it('mixed changes use highest severity', () => {
    const mixed: PageDiff = {
      isIdentical: false,
      changes: [
        { kind: 'page-title-changed', from: 'A', to: 'B' },
        { kind: 'section-added', sectionId: 'x', sectionType: 'cta' },
        { kind: 'section-removed', sectionId: 'y', sectionType: 'hero' },
      ],
    };
    const result = calculateNextVersion(mixed, '1.0.0');
    expect(result.version).toBe('2.0.0');
    expect(result.bumpType).toBe('major');
  });
});

// ─── ensureVersionIncrement ───────────────────────────────────────────────────

describe('ensureVersionIncrement', () => {
  it('returns candidate when strictly greater', () => {
    expect(ensureVersionIncrement('1.2.4', '1.2.3')).toBe('1.2.4');
  });

  it('forces patch bump when candidate equals previous', () => {
    expect(ensureVersionIncrement('1.2.3', '1.2.3')).toBe('1.2.4');
  });

  it('forces patch bump when candidate is less than previous', () => {
    expect(ensureVersionIncrement('1.0.0', '1.2.3')).toBe('1.2.4');
  });

  it('handles major version correctly', () => {
    expect(ensureVersionIncrement('2.0.0', '1.9.9')).toBe('2.0.0');
  });
});
