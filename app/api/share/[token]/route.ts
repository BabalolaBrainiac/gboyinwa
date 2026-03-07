import { NextRequest, NextResponse } from 'next/server';
import { getShareByToken } from '@/lib/documents';
import { getSignedFileUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// Cache signed URLs for 50 minutes (URLs valid for 60 min)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = await getShareByToken(token);

    if (!share) {
      return NextResponse.json(
        { error: 'This link is invalid or has expired' },
        { status: 404 }
      );
    }

    // Get additional info about who shared it
    const { getServiceClient } = await import('@/lib/supabase');
    const supabase = getServiceClient();
    const { data: user } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', share.shared_by)
      .single();

    // Generate a signed URL for the file (valid for 7 days = 604800 seconds)
    // Check cache first
    const now = Date.now();
    let signedUrl: string;
    const cached = signedUrlCache.get(share.document.file_key);
    
    if (cached && cached.expiresAt > now) {
      signedUrl = cached.url;
    } else {
      // Generate new signed URL valid for 7 days
      signedUrl = await getSignedFileUrl(share.document.file_key, 604800);
      // Cache for 6 days (518400 seconds in ms)
      signedUrlCache.set(share.document.file_key, {
        url: signedUrl,
        expiresAt: now + 518400000,
      });
    }

    return NextResponse.json({
      ...share,
      document: {
        ...share.document,
        file_url: signedUrl, // Replace private URL with signed URL
      },
      shared_by: user || { display_name: null },
      shared_at: share.created_at,
    });
  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json(
      { error: 'Failed to load document' },
      { status: 500 }
    );
  }
}
