import type { Metadata } from 'next';
import Link from 'next/link';
import { contentfulAdapter } from '@/cms/pageRepository';
import { requirePermission } from '@/lib/auth/guards';

export const metadata: Metadata = {
  title: 'Studio',
  robots: { index: false, follow: false },
};

export default async function StudioIndexPage() {
  // Server-side auth check — all authenticated roles can access
  await requirePermission('page:read');

  const result = await contentfulAdapter.fetchAllSlugs();
  const slugs = result.ok ? result.value : [];

  return (
    <main id="main-content" className="mx-auto max-w-lg px-6 py-16">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Page Studio</h1>
      <p className="mb-8 text-sm text-gray-500">Select a page to open the editor.</p>

      {slugs.length > 0 ? (
        <ul
          role="list"
          className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white"
        >
          {slugs.map((slug) => (
            <li key={slug}>
              <Link
                href={`/studio/${slug}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              >
                <span className="font-medium text-gray-800">{slug}</span>
                <span aria-hidden="true" className="text-gray-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="mb-1 text-sm font-medium text-gray-600">
            No pages found in Contentful
          </p>
          <p className="mb-4 text-xs text-gray-400">
            Configure your Contentful credentials in{' '}
            <code className="font-mono">.env.local</code> to see your pages here,
            or try the demo editor below.
          </p>
          <Link
            href="/studio/demo"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Open demo editor
          </Link>
        </div>
      )}
    </main>
  );
}
