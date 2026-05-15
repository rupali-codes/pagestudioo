'use client';

/**
 * ReleaseHistory — sidebar panel showing all published releases for the
 * current page, with changelog entries and bump type indicators.
 *
 * Data flow:
 *   - On mount, useReleaseHistory fetches from /api/releases/[slug] and
 *     populates the Redux release slice.
 *   - After each publish, usePublishDraft appends the new release to Redux
 *     directly — no re-fetch needed.
 *   - This component reads from Redux only; it has no fetch logic.
 */

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectReleases, selectDraft } from '@/store/selectors';
import { useReleaseHistory } from '@/hooks/useReleaseHistory';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import type { PageRelease, ChangelogEntry } from '@/types/page';

// ─── Bump type badge colours ──────────────────────────────────────────────────

const BUMP_BADGE: Record<string, 'error' | 'warning' | 'default'> = {
  major: 'error',
  minor: 'warning',
  patch: 'default',
};

const SEVERITY_COLOUR: Record<ChangelogEntry['severity'], string> = {
  major: 'text-red-600',
  minor: 'text-yellow-600',
  patch: 'text-gray-500',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ReleaseHistory() {
  const draft = useAppSelector(selectDraft);
  const releases = useAppSelector(selectReleases);
  const slug = draft?.slug ?? '';

  // Load history from server on mount
  const { isLoading, error } = useReleaseHistory(slug);

  // Sort newest first
  const sorted = [...releases].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <section aria-label="Release history" className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Releases
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <p className="p-4 text-xs text-gray-400" aria-live="polite">
            Loading releases…
          </p>
        )}

        {error && (
          <p className="p-4 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-xs text-gray-400">No releases yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Publish to create the first version.
            </p>
          </div>
        )}

        {sorted.length > 0 && (
          <ul role="list" className="divide-y divide-gray-100">
            {sorted.map((release, i) => (
              <ReleaseItem
                key={release.releaseId}
                release={release}
                isLatest={i === 0}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── Release item ─────────────────────────────────────────────────────────────

interface ReleaseItemProps {
  release: PageRelease;
  isLatest: boolean;
}

function ReleaseItem({ release, isLatest }: ReleaseItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChangelog = release.changelog && release.changelog.length > 0;

  // Derive bump type from the highest-severity changelog entry
  const bumpType = deriveBumpType(release.changelog ?? []);

  return (
    <li className="px-4 py-3">
      {/* Version row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="info">v{release.version}</Badge>
          {isLatest && (
            <Badge variant="success" className="text-[10px]">
              latest
            </Badge>
          )}
          {bumpType && (
            <Badge variant={BUMP_BADGE[bumpType] ?? 'default'} className="text-[10px] capitalize">
              {bumpType}
            </Badge>
          )}
        </div>
        <time
          dateTime={release.publishedAt}
          className="shrink-0 text-xs text-gray-400"
          title={new Date(release.publishedAt).toLocaleString()}
        >
          {formatRelativeTime(release.publishedAt)}
        </time>
      </div>

      {/* Publisher */}
      <p className="mt-0.5 text-xs text-gray-400">
        by {release.publishedBy}
      </p>

      {/* Changelog toggle */}
      {hasChangelog && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
          >
            <svg
              aria-hidden="true"
              className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {release.changelog.length} change{release.changelog.length !== 1 ? 's' : ''}
          </button>

          {isExpanded && (
            <ul
              className="mt-2 space-y-1"
              aria-label={`Changelog for v${release.version}`}
            >
              {release.changelog.map((entry, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 text-[10px] font-semibold uppercase',
                      SEVERITY_COLOUR[entry.severity],
                    )}
                  >
                    {entry.severity.slice(0, 3)}
                  </span>
                  <span className="text-xs text-gray-600">{entry.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveBumpType(
  changelog: ChangelogEntry[],
): 'major' | 'minor' | 'patch' | null {
  if (changelog.length === 0) return null;
  if (changelog.some((e) => e.severity === 'major')) return 'major';
  if (changelog.some((e) => e.severity === 'minor')) return 'minor';
  return 'patch';
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
