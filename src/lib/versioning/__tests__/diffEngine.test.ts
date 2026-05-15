import { describe, it, expect } from 'vitest';
import { diffPages } from '../diffEngine';
import type { Page } from '@/types/page';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const heroSection = {
  id: 'hero-1',
  type: 'hero' as const,
  props: { heading: 'Hello', subheading: 'World' },
};

const ctaSection = {
  id: 'cta-1',
  type: 'cta' as const,
  props: { heading: 'CTA', primaryLabel: 'Go', primaryHref: '/go' },
};

const basePage: Page = {
  pageId: 'page-1',
  slug: 'home',
  title: 'Home',
  sections: [heroSection, ctaSection],
};

// ─── First publish ────────────────────────────────────────────────────────────

describe('diffPages — first publish (no previous)', () => {
  it('returns isIdentical=false', () => {
    const diff = diffPages(null, basePage);
    expect(diff.isIdentical).toBe(false);
  });

  it('records every section as added', () => {
    const diff = diffPages(null, basePage);
    const kinds = diff.changes.map((c) => c.kind);
    expect(kinds).toEqual(['section-added', 'section-added']);
  });
});

// ─── Identical content ────────────────────────────────────────────────────────

describe('diffPages — identical content', () => {
  it('returns isIdentical=true and no changes', () => {
    const diff = diffPages(basePage, basePage);
    expect(diff.isIdentical).toBe(true);
    expect(diff.changes).toHaveLength(0);
  });

  it('deep-cloned page with same content is identical', () => {
    const clone: Page = JSON.parse(JSON.stringify(basePage));
    const diff = diffPages(basePage, clone);
    expect(diff.isIdentical).toBe(true);
  });
});

// ─── Title change ─────────────────────────────────────────────────────────────

describe('diffPages — title change', () => {
  it('records page-title-changed', () => {
    const next = { ...basePage, title: 'New Title' };
    const diff = diffPages(basePage, next);
    expect(diff.changes).toContainEqual({
      kind: 'page-title-changed',
      from: 'Home',
      to: 'New Title',
    });
  });
});

// ─── Section added ────────────────────────────────────────────────────────────

describe('diffPages — section added', () => {
  it('records section-added for new section', () => {
    const newSection = {
      id: 'feat-1',
      type: 'featureGrid' as const,
      props: { features: [] },
    };
    const next = { ...basePage, sections: [...basePage.sections, newSection] };
    const diff = diffPages(basePage, next);
    expect(diff.changes).toContainEqual({
      kind: 'section-added',
      sectionId: 'feat-1',
      sectionType: 'featureGrid',
    });
  });
});

// ─── Section removed ──────────────────────────────────────────────────────────

describe('diffPages — section removed', () => {
  it('records section-removed', () => {
    const next = { ...basePage, sections: [heroSection] };
    const diff = diffPages(basePage, next);
    expect(diff.changes).toContainEqual({
      kind: 'section-removed',
      sectionId: 'cta-1',
      sectionType: 'cta',
    });
  });
});

// ─── Section type changed ─────────────────────────────────────────────────────

describe('diffPages — section type changed', () => {
  it('records section-type-changed', () => {
    const mutated = { ...ctaSection, type: 'testimonial' as const };
    const next = { ...basePage, sections: [heroSection, mutated] };
    const diff = diffPages(basePage, next);
    expect(diff.changes).toContainEqual({
      kind: 'section-type-changed',
      sectionId: 'cta-1',
      from: 'cta',
      to: 'testimonial',
    });
  });

  it('does not also record prop changes when type changed', () => {
    const mutated = {
      ...ctaSection,
      type: 'testimonial' as const,
      props: { different: true },
    };
    const next = { ...basePage, sections: [heroSection, mutated] };
    const diff = diffPages(basePage, next);
    const propChanges = diff.changes.filter(
      (c) => c.kind === 'section-props-changed',
    );
    expect(propChanges).toHaveLength(0);
  });
});

// ─── Props changed ────────────────────────────────────────────────────────────

describe('diffPages — props changed', () => {
  it('records section-props-changed with changed keys', () => {
    const mutated = {
      ...heroSection,
      props: { heading: 'Updated', subheading: 'World' },
    };
    const next = { ...basePage, sections: [mutated, ctaSection] };
    const diff = diffPages(basePage, next);
    expect(diff.changes).toContainEqual({
      kind: 'section-props-changed',
      sectionId: 'hero-1',
      sectionType: 'hero',
      changedKeys: ['heading'],
    });
  });

  it('detects added prop key', () => {
    const mutated = {
      ...heroSection,
      props: { heading: 'Hello', subheading: 'World', imageUrl: 'https://x.com/img.png' },
    };
    const next = { ...basePage, sections: [mutated, ctaSection] };
    const diff = diffPages(basePage, next);
    const change = diff.changes.find((c) => c.kind === 'section-props-changed');
    expect(change).toBeDefined();
    if (change?.kind === 'section-props-changed') {
      expect(change.changedKeys).toContain('imageUrl');
    }
  });

  it('detects removed prop key', () => {
    const mutated = { ...heroSection, props: { heading: 'Hello' } };
    const next = { ...basePage, sections: [mutated, ctaSection] };
    const diff = diffPages(basePage, next);
    const change = diff.changes.find((c) => c.kind === 'section-props-changed');
    if (change?.kind === 'section-props-changed') {
      expect(change.changedKeys).toContain('subheading');
    }
  });
});

// ─── Section reordered ────────────────────────────────────────────────────────

describe('diffPages — section reordered', () => {
  it('records section-reordered when order changes', () => {
    const next = { ...basePage, sections: [ctaSection, heroSection] };
    const diff = diffPages(basePage, next);
    const reorders = diff.changes.filter((c) => c.kind === 'section-reordered');
    expect(reorders.length).toBeGreaterThan(0);
  });

  it('does not record reorder when order is unchanged', () => {
    const next: Page = JSON.parse(JSON.stringify(basePage));
    next.sections[0]!.props = { heading: 'Changed' };
    const diff = diffPages(basePage, next);
    const reorders = diff.changes.filter((c) => c.kind === 'section-reordered');
    expect(reorders).toHaveLength(0);
  });
});
