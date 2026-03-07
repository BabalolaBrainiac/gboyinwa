import { NextRequest, NextResponse } from 'next/server';
import { getShareByToken, recordDocumentView } from '@/lib/documents';
import { getSignedFileUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Validate the share token
    const share = await getShareByToken(token);
    if (!share) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 404 }
      );
    }

    // Record the download/view
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    await recordDocumentView(
      share.document_id,
      undefined, // Anonymous viewer
      ip
    );

    // Generate a fresh signed URL for download (1 hour validity)
    const signedUrl = await getSignedFileUrl(share.document.file_key, 3600);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Error handling download:', error);
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    );
  }
}
