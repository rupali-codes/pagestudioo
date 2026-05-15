import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { contentfulAdapter } from '@/cms/pageRepository';
import { PageRenderer } from '@/components/page/PageRenderer';
import { PageErrorBoundary } from '@/components/page/PageErrorBoundary';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate static paths at build time from all published slugs.
 * Falls back to an empty array (dynamic rendering) if the CMS is unreachable.
 */
export async function generateStaticParams() {
  const result = await contentfulAdapter.fetchAllSlugs();
  if (!result.ok) {
    console.warn('[generateStaticParams] Could not fetch slugs:', result.error.message);
    return [];
  }
  return result.value.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await contentfulAdapter.fetchPageBySlug(slug);
  if (!result.ok) return { title: 'Page not found' };
  return { title: result.value.title };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await contentfulAdapter.fetchPageBySlug(slug);

  if (!result.ok) {
    notFound();
  }

  return (
    <PageErrorBoundary>
      <PageRenderer page={result.value} />
    </PageErrorBoundary>
  );
}
