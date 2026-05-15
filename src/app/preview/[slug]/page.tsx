import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import type { Metadata } from 'next';
import { contentfulAdapter } from '@/cms/pageRepository';
import { PageRenderer } from '@/components/page/PageRenderer';
import { PageErrorBoundary } from '@/components/page/PageErrorBoundary';

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Preview: ${slug}`,
    // Prevent search engines from indexing preview pages
    robots: { index: false, follow: false },
  };
}

/**
 * Preview route — renders a page using the Contentful Preview API so content
 * authors can see unpublished changes before going live.
 *
 * Access rules:
 *   - Production: requires Next.js Draft Mode to be active (set by
 *     GET /api/preview?secret=...&slug=...). Without it, returns 404.
 *     This prevents public access to unpublished content.
 *   - Development: Draft Mode check is skipped so developers can visit
 *     /preview/<slug> directly without configuring Contentful webhooks.
 *
 * Server Component: no 'use client' — data fetching happens on the server,
 * keeping Contentful credentials out of the browser bundle entirely.
 */
export default async function PreviewPage({ params }: PreviewPageProps) {
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    // In production, enforce Draft Mode — this is the auth gate for preview.
    // Return 404 rather than 401 to avoid confirming that preview URLs exist.
    const { isEnabled } = await draftMode();
    if (!isEnabled) notFound();
  }

  const { slug } = await params;

  // Always use the Preview API on this route — the whole point is to see
  // unpublished content. The delivery API would show the published version.
  const result = await contentfulAdapter.fetchPageBySlug(slug, {
    preview: true,
  });

  if (!result.ok) {
    console.warn(`[preview/${slug}] ${result.error.message}`);
    notFound();
  }

  return (
    <PageErrorBoundary>
      <PageRenderer page={result.value} isPreview />
    </PageErrorBoundary>
  );
}
