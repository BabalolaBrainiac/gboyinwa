import { NextRequest, NextResponse } from 'next/server';
import { markShareAsViewed, recordDocumentView, getShareByToken } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Get share to find document ID
    const share = await getShareByToken(token);
    if (!share) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 404 }
      );
    }

    // Mark share as viewed
    await markShareAsViewed(token);

    // Record the view in document views
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    await recordDocumentView(
      share.document_id,
      undefined, // Anonymous viewer
      ip
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
