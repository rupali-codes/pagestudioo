import { describe, it, expect } from 'vitest';
import { buildSnapshot, verifySnapshot } from '../snapshotGenerator';
import { hashPageContent } from '../contentHash';
import type { Page } from '@/types/page';

const page: Page = {
  pageId: 'p1',
  slug: 'home',
  title: 'Home',
  sections: [
    { id: 's1', type: 'hero', props: { heading: 'Hi' } },
  ],
};

const input = {
  page,
  version: '1.0.0',
  publishedBy: 'user-1',
  publishedAt: '2024-01-01T00:00:00.000Z',
  changelog: [{ severity: 'minor' as const, message: 'Added hero section' }],
};

describe('buildSnapshot', () => {
  it('sets releaseId as pageId@version', () => {
    const snap = buildSnapshot(input);
    expect(snap.releaseId).toBe('p1@1.0.0');
  });

  it('sets contentHash matching the page', () => {
    const snap = buildSnapshot(input);
    expect(snap.contentHash).toBe(hashPageContent(page));
  });

  it('copies changelog', () => {
    const snap = buildSnapshot(input);
    expect(snap.changelog).toEqual(input.changelog);
  });

  it('deep-clones sections — mutating source does not affect snapshot', () => {
    const snap = buildSnapshot(input);
    // Mutate the original page sections
    page.sections[0]!.props = { heading: 'Mutated' };
    // Snapshot should be unchanged
    expect(snap.sections[0]!.props).toEqual({ heading: 'Hi' });
    // Restore
    page.sections[0]!.props = { heading: 'Hi' };
  });

  it('is deterministic — same input produces same snapshot', () => {
    const a = buildSnapshot(input);
    const b = buildSnapshot(input);
    expect(a.releaseId).toBe(b.releaseId);
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.version).toBe(b.version);
  });
});

describe('verifySnapshot', () => {
  it('returns true for a valid snapshot', () => {
    const snap = buildSnapshot(input);
    expect(verifySnapshot(snap)).toBe(true);
  });

  it('returns false when sections are tampered with', () => {
    const snap = buildSnapshot(input);
    // Tamper with the snapshot after creation
    const tampered = {
      ...snap,
      sections: [{ ...snap.sections[0]!, props: { heading: 'Hacked' } }],
    };
    expect(verifySnapshot(tampered)).toBe(false);
  });

  it('returns false when title is tampered with', () => {
    const snap = buildSnapshot(input);
    const tampered = { ...snap, title: 'Hacked' };
    expect(verifySnapshot(tampered)).toBe(false);
  });
});
