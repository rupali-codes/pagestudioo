import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { contentfulAdapter } from '@/cms/pageRepository';
import { requirePermission } from '@/lib/auth/guards';
import { DEMO_PAGE, DEMO_SLUG } from '@/lib/demoPage';
import { SlugStudioShell } from './SlugStudioShell';

interface StudioSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: StudioSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug === DEMO_SLUG ? 'Studio — Demo' : `Studio — ${slug}`;
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export default async function StudioSlugPage({ params }: StudioSlugPageProps) {
  // ── Server-side auth check ───────────────────────────────────────────────
  // All authenticated roles (viewer, editor, publisher, admin) can access the
  // studio. Viewers see a read-only view; editors and above can edit.
  // Redirects to /auth/login if no session exists.
  await requirePermission('page:read');

  const { slug } = await params;

  // ── Demo mode — bypass CMS ────────────────────────────────────────────────
  if (slug === DEMO_SLUG) {
    return <SlugStudioShell page={DEMO_PAGE} />;
  }

  // ── CMS mode ──────────────────────────────────────────────────────────────
  const result = await contentfulAdapter.fetchPageBySlug(slug, {
    preview: true,
  });

  if (!result.ok) {
    console.warn(`[studio/${slug}] ${result.error.message}`);
    notFound();
  }

  return <SlugStudioShell page={result.value} />;
}
