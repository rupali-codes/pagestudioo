import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

/**
 * Enable Next.js Draft Mode for Contentful live preview.
 * Called by Contentful's preview webhook with a secret token.
 *
 * Usage: GET /api/preview?secret=<token>&slug=<slug>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');

  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 401 });
  }

  if (!slug) {
    return new Response('Missing slug parameter', { status: 400 });
  }

  const dm = await draftMode();
  dm.enable();

  redirect(`/preview/${slug}`);
}
