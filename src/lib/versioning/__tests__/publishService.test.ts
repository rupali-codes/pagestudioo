/**
 * Integration tests for the publish service.
 *
 * Uses a real temp directory per test so the full pipeline is exercised:
 * diff → version → snapshot → persist → reload.
 *
 * Strategy: spy on process.cwd() to redirect the snapshot store to a
 * temp directory. The spy is installed before each test and restored after.
 * publishPage and snapshotStore are imported fresh each test via dynamic
 * import with cache-busting to avoid module-level state leaking between tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Page } from '@/types/page';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const basePage: Page = {
  pageId: 'page-1',
  slug: 'home',
  title: 'Home',
  sections: [
    { id: 'hero-1', type: 'hero', props: { heading: 'Hello' } },
  ],
};

const AT = '2024-01-01T00:00:00.000Z';
const AT2 = '2024-01-02T00:00:00.000Z';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Import publishPage and snapshotStore helpers with process.cwd() already
 * pointing at the temp dir. We use a cache-busting query string so Vitest
 * re-evaluates the module for each test group.
 */
async function getHelpers(tempDir: string) {
  vi.spyOn(process, 'cwd').mockReturnValue(tempDir);

  // Dynamic import after the spy is installed — the modules read cwd() at
  // call time (inside functions), so the spy is effective immediately.
  const { publishPage } = await import('../publishService');
  const store = await import('../snapshotStore');
  return { publishPage, store };
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

let tempDir = '';

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'ps-test-'));
});

afterEach(async () => {
  vi.restoreAllMocks();
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = '';
  }
});

// ─── First publish ────────────────────────────────────────────────────────────

describe('publishPage — first publish', () => {
  it('returns status=published and version 0.1.0', async () => {
    const { publishPage } = await getHelpers(tempDir);
    const result = await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('published');
    expect(result.value.release.version).toBe('0.1.0');
  });

  it('sets previousRelease to null on first publish', async () => {
    const { publishPage } = await getHelpers(tempDir);
    const result = await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.previousRelease).toBeNull();
  });

  it('persists snapshot file to disk', async () => {
    const { publishPage, store } = await getHelpers(tempDir);
    await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });

    const path = store.snapshotPath('home', '0.1.0');
    expect(existsSync(path)).toBe(true);
  });

  it('snapshot passes integrity check on reload', async () => {
    const { publishPage, store } = await getHelpers(tempDir);
    const { verifySnapshot } = await import('../snapshotGenerator');

    await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });

    const loaded = await store.loadLatestSnapshot('home');
    expect(loaded).not.toBeNull();
    expect(verifySnapshot(loaded!)).toBe(true);
  });
});

// ─── Idempotency ──────────────────────────────────────────────────────────────

describe('publishPage — idempotency', () => {
  it('returns status=noop when same content published twice', async () => {
    const { publishPage } = await getHelpers(tempDir);

    await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });
    const result = await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT2 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('noop');
    expect(result.value.release.version).toBe('0.1.0');
  });

  it('does not create a new snapshot file on noop', async () => {
    const { publishPage, store } = await getHelpers(tempDir);

    await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });
    await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT2 });

    expect(existsSync(store.snapshotPath('home', '0.1.0'))).toBe(true);
    expect(existsSync(store.snapshotPath('home', '0.1.1'))).toBe(false);
  });
});

// ─── Version bumping ──────────────────────────────────────────────────────────

describe('publishPage — version bumping', () => {
  it('bumps patch for prop change', async () => {
    const { publishPage } = await getHelpers(tempDir);

    await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });

    const updated: Page = {
      ...basePage,
      sections: [{ ...basePage.sections[0]!, props: { heading: 'Updated' } }],
    };
    const result = await publishPage({ page: updated, publishedBy: 'u1', publishedAt: AT2 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.release.version).toBe('0.1.1');
    expect(result.value.bumpType).toBe('patch');
  });

  it('bumps minor for section addition', async () => {
    const { publishPage } = await getHelpers(tempDir);

    await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });

    const withCta: Page = {
      ...basePage,
      sections: [
        ...basePage.sections,
        { id: 'cta-1', type: 'cta', props: { heading: 'CTA', primaryLabel: 'Go', primaryHref: '/' } },
      ],
    };
    const result = await publishPage({ page: withCta, publishedBy: 'u1', publishedAt: AT2 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.release.version).toBe('0.2.0');
    expect(result.value.bumpType).toBe('minor');
  });

  it('bumps major for section removal', async () => {
    const { publishPage } = await getHelpers(tempDir);

    const twoSections: Page = {
      ...basePage,
      sections: [
        basePage.sections[0]!,
        { id: 'cta-1', type: 'cta', props: { heading: 'CTA', primaryLabel: 'Go', primaryHref: '/' } },
      ],
    };
    await publishPage({ page: twoSections, publishedBy: 'u1', publishedAt: AT });

    const result = await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT2 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.release.version).toBe('1.0.0');
    expect(result.value.bumpType).toBe('major');
  });
});

// ─── Changelog ────────────────────────────────────────────────────────────────

describe('publishPage — changelog', () => {
  it('includes changelog entries for content changes', async () => {
    const { publishPage } = await getHelpers(tempDir);

    await publishPage({ page: basePage, publishedBy: 'u1', publishedAt: AT });

    const updated: Page = { ...basePage, title: 'New Title' };
    const result = await publishPage({ page: updated, publishedBy: 'u1', publishedAt: AT2 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.release.changelog.length).toBeGreaterThan(0);
    expect(result.value.release.changelog[0]!.message).toContain('New Title');
  });

  it('first publish changelog has at least one entry', async () => {
    // This is a fresh publish — use a dedicated subdirectory
    const freshDir = await mkdtemp(join(tmpdir(), 'ps-cl-'));
    try {
      vi.spyOn(process, 'cwd').mockReturnValue(freshDir);
      const { publishPage: publish } = await import('../publishService');
      const result = await publish({ page: basePage, publishedBy: 'u1', publishedAt: AT });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // First publish always has changelog entries (all sections are "added")
      expect(result.value.release.changelog.length).toBeGreaterThan(0);
    } finally {
      vi.restoreAllMocks();
      await rm(freshDir, { recursive: true, force: true });
    }
  });
});

// ─── Multiple slugs ───────────────────────────────────────────────────────────

describe('publishPage — multiple slugs are independent', () => {
  it('each slug has its own version sequence', async () => {
    const { publishPage } = await getHelpers(tempDir);

    const pageA: Page = { ...basePage, slug: 'page-a' };
    const pageB: Page = { ...basePage, pageId: 'page-2', slug: 'page-b' };

    // Publish page-b twice to advance its version
    await publishPage({ page: pageB, publishedBy: 'u1', publishedAt: AT });
    const updatedB: Page = { ...pageB, title: 'Updated B' };
    await publishPage({ page: updatedB, publishedBy: 'u1', publishedAt: AT2 });

    // First publish of page-a should still be 0.1.0
    const resultA = await publishPage({ page: pageA, publishedBy: 'u1', publishedAt: AT });

    expect(resultA.ok).toBe(true);
    if (!resultA.ok) return;
    expect(resultA.value.release.version).toBe('0.1.0');
  });
});
