import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { SectionTypeSchema } from '@/schemas/section';
import { SectionSchema } from '@/schemas/section';
import { PageSchema } from '@/schemas/page';
import { PageReleaseSchema } from '@/schemas/page';
import { HeroPropsSchema } from '@/schemas/props/hero';
import { CtaPropsSchema } from '@/schemas/props/cta';

describe('SectionTypeSchema', () => {
  it('accepts valid section types', () => {
    expect(SectionTypeSchema.parse('hero')).toBe('hero');
    expect(SectionTypeSchema.parse('featureGrid')).toBe('featureGrid');
    expect(SectionTypeSchema.parse('testimonial')).toBe('testimonial');
    expect(SectionTypeSchema.parse('cta')).toBe('cta');
  });

  it('rejects invalid section types', () => {
    expect(() => SectionTypeSchema.parse('banner')).toThrow();
    expect(() => SectionTypeSchema.parse('')).toThrow();
    expect(() => SectionTypeSchema.parse(123)).toThrow();
  });
});

describe('SectionSchema', () => {
  it('accepts a valid section', () => {
    const section = {
      id: 'sec-1',
      type: 'hero',
      props: { heading: 'Hello' },
    };
    expect(SectionSchema.parse(section)).toEqual(section);
  });

  it('accepts section with empty props', () => {
    const section = { id: 'sec-1', type: 'cta', props: {} };
    expect(SectionSchema.parse(section)).toEqual(section);
  });

  it('rejects section without id', () => {
    expect(() =>
      SectionSchema.parse({ type: 'hero', props: {} }),
    ).toThrow(z.ZodError);
  });

  it('rejects section with empty id', () => {
    expect(() =>
      SectionSchema.parse({ id: '', type: 'hero', props: {} }),
    ).toThrow(z.ZodError);
  });

  it('rejects section with unknown type', () => {
    expect(() =>
      SectionSchema.parse({ id: 'x', type: 'unknown', props: {} }),
    ).toThrow(z.ZodError);
  });
});

describe('PageSchema', () => {
  const validPage = {
    pageId: 'page-1',
    slug: 'home',
    title: 'Home Page',
    sections: [
      { id: 's1', type: 'hero', props: { heading: 'Hi' } },
    ],
  };

  it('accepts a valid page', () => {
    expect(PageSchema.parse(validPage)).toEqual(validPage);
  });

  it('accepts a page with no sections', () => {
    const page = { ...validPage, sections: [] };
    expect(PageSchema.parse(page)).toEqual(page);
  });

  it('rejects page with invalid slug characters', () => {
    expect(() =>
      PageSchema.parse({ ...validPage, slug: 'Home Page!' }),
    ).toThrow(z.ZodError);
  });

  it('rejects page with empty title', () => {
    expect(() =>
      PageSchema.parse({ ...validPage, title: '' }),
    ).toThrow(z.ZodError);
  });

  it('rejects page with missing pageId', () => {
    const rest = { slug: 'home', title: 'Home Page', sections: [] };
    expect(() => PageSchema.parse(rest)).toThrow(z.ZodError);
  });
});

describe('PageReleaseSchema', () => {
  const validRelease = {
    pageId: 'page-1',
    slug: 'home',
    title: 'Home Page',
    sections: [],
    releaseId: 'page-1@1.0.0',
    version: '1.0.0',
    publishedAt: '2026-05-16T12:00:00.000Z',
    publishedBy: 'user-1',
  };

  it('accepts a valid release', () => {
    expect(PageReleaseSchema.parse(validRelease)).toEqual(validRelease);
  });

  it('rejects release with non-semver version', () => {
    expect(() =>
      PageReleaseSchema.parse({ ...validRelease, version: '1.0' }),
    ).toThrow(z.ZodError);
  });

  it('rejects release with missing publishedAt', () => {
    const rest = {
      pageId: 'page-1', slug: 'home', title: 'Home Page',
      sections: [], releaseId: 'page-1@1.0.0', version: '1.0.0',
      publishedBy: 'user-1',
    };
    expect(() => PageReleaseSchema.parse(rest)).toThrow(z.ZodError);
  });

  it('rejects release with invalid publishedAt format', () => {
    expect(() =>
      PageReleaseSchema.parse({ ...validRelease, publishedAt: 'yesterday' }),
    ).toThrow(z.ZodError);
  });
});

describe('HeroPropsSchema', () => {
  it('accepts valid hero props', () => {
    const props = {
      heading: 'Welcome',
      subheading: 'Subtitle',
      ctaLabel: 'Click me',
      ctaHref: '/signup',
    };
    expect(HeroPropsSchema.parse(props)).toEqual(props);
  });

  it('rejects hero props without heading', () => {
    expect(() =>
      HeroPropsSchema.parse({ subheading: 'Sub' }),
    ).toThrow(z.ZodError);
  });

  it('rejects hero props with empty heading', () => {
    expect(() =>
      HeroPropsSchema.parse({ heading: '' }),
    ).toThrow(z.ZodError);
  });

  it('accepts hero props with only heading', () => {
    expect(HeroPropsSchema.parse({ heading: 'Hi' })).toEqual({ heading: 'Hi' });
  });
});

describe('CtaPropsSchema', () => {
  it('accepts valid CTA props', () => {
    const props = {
      heading: 'Call to action',
      body: 'Some body text',
      primaryLabel: 'Get started',
      primaryHref: '/start',
    };
    expect(CtaPropsSchema.parse(props)).toEqual(props);
  });

  it('rejects CTA props without heading', () => {
    expect(() =>
      CtaPropsSchema.parse({ primaryLabel: 'Go', primaryHref: '/go' }),
    ).toThrow(z.ZodError);
  });

  it('rejects CTA props without primaryLabel', () => {
    expect(() =>
      CtaPropsSchema.parse({ heading: 'Hi', primaryHref: '/go' }),
    ).toThrow(z.ZodError);
  });

  it('rejects CTA props without primaryHref', () => {
    expect(() =>
      CtaPropsSchema.parse({ heading: 'Hi', primaryLabel: 'Go' }),
    ).toThrow(z.ZodError);
  });

  it('accepts minimal valid CTA props', () => {
    const props = { heading: 'Hi', primaryLabel: 'Go', primaryHref: '/go' };
    expect(CtaPropsSchema.parse(props)).toEqual(props);
  });
});
