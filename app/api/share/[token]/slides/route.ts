import { NextRequest, NextResponse } from 'next/server';
import { getShareByToken } from '@/lib/documents';
import { getSignedFileUrl } from '@/lib/r2';
import { SlidePreviewMeta } from '@/lib/slide-converter';

export const dynamic = 'force-dynamic';

// Public endpoint — no auth, validated via the share token
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const share = await getShareByToken(token);
    if (!share) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const previews = share.document.metadata?.slide_previews as SlidePreviewMeta | undefined;
    if (!previews?.keys?.length) {
      return NextResponse.json({ urls: [], slide_count: 0 });
    }

    // Use 7-day signed URLs to match the main share URL lifetime
    const urls = await Promise.all(previews.keys.map(key => getSignedFileUrl(key, 604800)));
    return NextResponse.json({ urls, slide_count: previews.slide_count });
  } catch (err) {
    console.error('[share:slides:get]', err);
    return NextResponse.json({ error: 'Failed to load slides' }, { status: 500 });
  }
}
