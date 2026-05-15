'use client';

import { useAppSelector } from '@/store/hooks';
import { selectReleases } from '@/store/selectors';
import { Badge } from '@/components/ui/Badge';

export function ReleaseHistory() {
  const releases = useAppSelector(selectReleases);

  if (releases.length === 0) {
    return (
      <p className="p-4 text-sm text-gray-500">No releases yet.</p>
    );
  }

  const sorted = [...releases].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <section aria-label="Release history">
      <h2 className="border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Release history
      </h2>
      <ul role="list" className="divide-y divide-gray-100">
        {sorted.map((release) => (
          <li key={release.releaseId} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Badge variant="info">v{release.version}</Badge>
              <time
                dateTime={release.publishedAt}
                className="text-xs text-gray-400"
              >
                {new Date(release.publishedAt).toLocaleDateString()}
              </time>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Published by {release.publishedBy}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
