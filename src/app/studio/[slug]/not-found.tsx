import Link from 'next/link';

/**
 * Shown when /studio/[slug] calls notFound() — i.e. the slug doesn't exist
 * in Contentful or the CMS is unreachable.
 */
export default function StudioNotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="max-w-sm text-sm text-gray-500">
        This page doesn&apos;t exist in Contentful, or your CMS credentials
        aren&apos;t configured yet.
      </p>
      <Link
        href="/studio"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Back to Studio
      </Link>
    </main>
  );
}
