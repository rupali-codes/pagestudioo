import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900">Page Studio</h1>
      <p className="max-w-md text-gray-600">
        Schema-driven landing page builder powered by Contentful CMS.
      </p>
      <div className="flex gap-4">
        <Link
          href="/pages/home"
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          View example page
        </Link>
        <Link
          href="/studio"
          className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          Open Studio
        </Link>
      </div>
    </main>
  );
}
