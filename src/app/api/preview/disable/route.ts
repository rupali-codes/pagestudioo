import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

/** Disable Draft Mode and redirect back to the published page. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get('slug') ?? '';

  const dm = await draftMode();
  dm.disable();

  redirect(slug ? `/pages/${slug}` : '/');
}
