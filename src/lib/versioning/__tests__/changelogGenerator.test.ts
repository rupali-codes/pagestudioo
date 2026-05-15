import { describe, it, expect } from 'vitest';
import { generateChangelog, formatChangelog } from '../changelogGenerator';
import type { PageDiff } from '@/types/page';

describe('generateChangelog', () => {
  it('returns empty array for identical diff', () => {
    const diff: PageDiff = { isIdentical: true, changes: [] };
    expect(generateChangelog(diff)).toEqual([]);
  });

  it('returns empty array for diff with no changes', () => {
    const diff: PageDiff = { isIdentical: false, changes: [] };
    expect(generateChangelog(diff)).toEqual([]);
  });

  it('generates correct entry for section-added', () => {
    const diff: PageDiff = {
      isIdentical: false,
      changes: [{ kind: 'section-added', sectionId: 'x', sectionType: 'hero' }],
    };
    const entries = generateChangelog(diff);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.severity).toBe('minor');
    expect(entries[0]!.message).toContain('Hero');
    expect(entries[0]!.message).toContain('x');
  });

  it('generates correct entry for section-removed', () => {
    const diff: PageDiff = {
      isIdentical: false,
      changes: [{ kind: 'section-removed', sectionId: 'y', sectionType: 'cta' }],
    };
    const entries = generateChangelog(diff);
    expect(entries[0]!.severity).toBe('major');
    expect(entries[0]!.message).toContain('Call to Action');
  });

  it('sorts major before minor before patch', () => {
    const diff: PageDiff = {
      isIdentical: false,
      changes: [
        { kind: 'page-title-changed', from: 'A', to: 'B' },
        { kind: 'section-added', sectionId: 'x', sectionType: 'cta' },
        { kind: 'section-removed', sectionId: 'y', sectionType: 'hero' },
      ],
    };
    const entries = generateChangelog(diff);
    expect(entries[0]!.severity).toBe('major');
    expect(entries[1]!.severity).toBe('minor');
    expect(entries[2]!.severity).toBe('patch');
  });

  it('generates correct entry for section-type-changed', () => {
    const diff: PageDiff = {
      isIdentical: false,
      changes: [
        {
          kind: 'section-type-changed',
          sectionId: 'z',
          from: 'hero',
          to: 'cta',
        },
      ],
    };
    const entries = generateChangelog(diff);
    expect(entries[0]!.severity).toBe('major');
    expect(entries[0]!.message).toContain('Hero');
    expect(entries[0]!.message).toContain('Call to Action');
  });

  it('generates correct entry for section-props-changed', () => {
    const diff: PageDiff = {
      isIdentical: false,
      changes: [
        {
          kind: 'section-props-changed',
          sectionId: 'h1',
          sectionType: 'hero',
          changedKeys: ['heading', 'subheading'],
        },
      ],
    };
    const entries = generateChangelog(diff);
    expect(entries[0]!.severity).toBe('patch');
    expect(entries[0]!.message).toContain('heading');
    expect(entries[0]!.message).toContain('subheading');
  });

  it('generates correct entry for section-reordered', () => {
    const diff: PageDiff = {
      isIdentical: false,
      changes: [
        { kind: 'section-reordered', sectionId: 'h1', fromIndex: 0, toIndex: 2 },
      ],
    };
    const entries = generateChangelog(diff);
    expect(entries[0]!.severity).toBe('patch');
    expect(entries[0]!.message).toContain('position 1');
    expect(entries[0]!.message).toContain('3');
  });
});

describe('formatChangelog', () => {
  it('returns "No changes." for empty entries', () => {
    expect(formatChangelog([])).toBe('No changes.');
  });

  it('formats entries with severity prefix', () => {
    const entries = [
      { severity: 'major' as const, message: 'Removed hero' },
      { severity: 'patch' as const, message: 'Updated title' },
    ];
    const text = formatChangelog(entries);
    expect(text).toContain('[MAJOR] Removed hero');
    expect(text).toContain('[PATCH] Updated title');
  });
});
