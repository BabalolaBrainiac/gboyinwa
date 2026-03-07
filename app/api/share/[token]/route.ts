import { NextRequest, NextResponse } from 'next/server';
import { getShareByToken } from '@/lib/documents';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
      ...share,
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
