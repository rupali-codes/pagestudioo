import { test, expect } from '@playwright/test';
import type { Page } from '@/types/page';

const DEMO_PAGE: Page = {
  pageId: 'test-page',
  slug: 'test',
  title: 'Test Page',
  sections: [
    {
      id: 'hero-1',
      type: 'hero',
      props: { heading: 'Hello' },
    },
  ],
};

test.describe('Publish API', () => {
  test('creates a release with correct semver', async ({ request }) => {
    const response = await request.post('/api/publish', {
      data: {
        page: DEMO_PAGE,
        publishedBy: 'test-user',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.release).toMatchObject({
      pageId: 'test-page',
      version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
      publishedBy: 'test-user',
    });
  });

  test('bumps minor version when sections are added', async ({ request }) => {
    const response = await request.post('/api/publish', {
      data: {
        page: DEMO_PAGE,
        publishedBy: 'test-user',
        previousVersion: '1.0.0',
        previousSectionTypes: [], // no previous sections → adding hero is minor
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.release.version).toBe('1.1.0');
  });

  test('returns 422 for invalid page schema', async ({ request }) => {
    const response = await request.post('/api/publish', {
      data: {
        page: { pageId: '', slug: '', title: '', sections: [] },
        publishedBy: 'test-user',
      },
    });

    expect(response.status()).toBe(422);
  });
});
