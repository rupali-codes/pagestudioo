import { describe, it, expect } from 'vitest';
import { hashPageContent, canonicalPageJson } from '../contentHash';
import type { Page } from '@/types/page';

const page: Page = {
  pageId: 'p1',
  slug: 'home',
  title: 'Home',
  sections: [
    { id: 's1', type: 'hero', props: { heading: 'Hi', b: 2, a: 1 } },
  ],
};

describe('hashPageContent', () => {
  it('returns a 64-char hex string (SHA-256)', () => {
    const hash = hashPageContent(page);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic — same input produces same hash', () => {
    expect(hashPageContent(page)).toBe(hashPageContent(page));
  });

  it('deep clone produces same hash', () => {
    const clone: Page = JSON.parse(JSON.stringify(page));
    expect(hashPageContent(clone)).toBe(hashPageContent(page));
  });

  it('different title produces different hash', () => {
    const other = { ...page, title: 'Other' };
    expect(hashPageContent(other)).not.toBe(hashPageContent(page));
  });

  it('different prop value produces different hash', () => {
    const other: Page = {
      ...page,
      sections: [{ ...page.sections[0]!, props: { heading: 'Changed' } }],
    };
    expect(hashPageContent(other)).not.toBe(hashPageContent(page));
  });

  it('section order change produces different hash', () => {
    const s2 = { id: 's2', type: 'cta' as const, props: { heading: 'CTA', primaryLabel: 'Go', primaryHref: '/' } };
    const pageAB: Page = { ...page, sections: [page.sections[0]!, s2] };
    const pageBA: Page = { ...page, sections: [s2, page.sections[0]!] };
    expect(hashPageContent(pageAB)).not.toBe(hashPageContent(pageBA));
  });
});

describe('canonicalPageJson', () => {
  it('sorts prop keys alphabetically', () => {
    const json = canonicalPageJson(page);
    const parsed = JSON.parse(json) as { sections: Array<{ props: Record<string, unknown> }> };
    const propKeys = Object.keys(parsed.sections[0]!.props);
    expect(propKeys).toEqual([...propKeys].sort());
  });

  it('produces same JSON regardless of original prop key order', () => {
    const pageAB: Page = {
      ...page,
      sections: [{ id: 's1', type: 'hero', props: { a: 1, b: 2 } }],
    };
    const pageBA: Page = {
      ...page,
      sections: [{ id: 's1', type: 'hero', props: { b: 2, a: 1 } }],
    };
    expect(canonicalPageJson(pageAB)).toBe(canonicalPageJson(pageBA));
  });
});
