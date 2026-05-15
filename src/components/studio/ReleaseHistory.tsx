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
import { getSectionDisplayName } from '@/registry/sectionRegistry';
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
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);

  // Load history from server on mount
  const { isLoading, error } = useReleaseHistory(slug);

  // Sort newest first
  const sorted = [...releases].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  function handleSelect(releaseId: string) {
    setSelectedReleaseId((prev) => (prev === releaseId ? null : releaseId));
  }

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
                isSelected={selectedReleaseId === release.releaseId}
                onSelect={() => handleSelect(release.releaseId)}
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
  isSelected: boolean;
  onSelect: () => void;
}

function ReleaseItem({ release, isLatest, isSelected, onSelect }: ReleaseItemProps) {
  const hasChangelog = release.changelog && release.changelog.length > 0;

  // Derive bump type from the highest-severity changelog entry
  const bumpType = deriveBumpType(release.changelog ?? []);

  return (
    <li
      className={cn(
        'px-4 py-3 cursor-pointer transition-colors',
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="button"
      aria-expanded={isSelected}
      aria-label={`Version ${release.version} published ${formatRelativeTime(release.publishedAt)}`}
    >
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

      {/* Expanded: sections + changelog */}
      {isSelected && (
        <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
          {/* Sections list */}
          <div>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Sections ({release.sections.length})
            </h3>
            <ul className="space-y-1" aria-label={`Sections in v${release.version}`}>
              {release.sections.map((section) => (
                <li
                  key={section.id}
                  className="rounded border border-gray-100 bg-white px-2 py-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Badge variant="default" className="text-[10px]">
                      {getSectionDisplayName(section.type)}
                    </Badge>
                    <span className="truncate text-xs text-gray-500" title={section.id}>
                      {section.id.slice(0, 8)}…
                    </span>
                  </div>
                  <PropsPreview props={section.props} />
                </li>
              ))}
            </ul>
          </div>

          {/* Changelog */}
          {hasChangelog && (
            <div>
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Changes
              </h3>
              <ul className="space-y-1" aria-label={`Changelog for v${release.version}`}>
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
            </div>
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

// ─── Props preview ─────────────────────────────────────────────────────────────

const PREVIEW_KEYS = ['title', 'heading', 'subheading', 'body', 'name', 'description'] as const;

function PropsPreview({ props }: { props: Record<string, unknown> }) {
  const previewEntries = PREVIEW_KEYS
    .filter((k) => typeof props[k] === 'string' && props[k] !== '')
    .map((k) => [k, props[k] as string]);

  if (previewEntries.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {previewEntries.map(([key, value]) => (
        <p key={key} className="truncate text-[11px] text-gray-400">
          <span className="font-medium text-gray-500">{key}:</span>{' '}
          {value}
        </p>
      ))}
    </div>
  );
}
