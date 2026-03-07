import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - fetch current user's profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, role, display_name, avatar_url, created_at')
    .eq('id', userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT - update current user's profile (name + optional avatar)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 });

  const contentType = request.headers.get('content-type') || '';
  let displayName: string | undefined;
  let avatarUrl: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const nameVal = formData.get('display_name');
    if (nameVal && typeof nameVal === 'string') displayName = nameVal.trim();

    const avatarFile = formData.get('avatar') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      // Validate: images only, max 5MB
      if (!avatarFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Avatar must be an image file' }, { status: 400 });
      }
      if (avatarFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Avatar must be under 5MB' }, { status: 400 });
      }

      const { uploadToR2 } = await import('@/lib/r2');
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const fileName = `${userId}.${ext}`;
      const { url } = await uploadToR2(buffer, fileName, avatarFile.type, 'avatars', '/');
      avatarUrl = url;
    }
  } else {
    const body = await request.json();
    if (body.display_name && typeof body.display_name === 'string') {
      displayName = body.display_name.trim();
    }
  }

  if (!displayName && !avatarUrl) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  // Validate display name length
  if (displayName && (displayName.length < 2 || displayName.length > 80)) {
    return NextResponse.json({ error: 'Display name must be 2-80 characters' }, { status: 400 });
  }

  const updateData: Record<string, string> = {};
  if (displayName) updateData.display_name = displayName;
  if (avatarUrl) updateData.avatar_url = avatarUrl;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, display_name, avatar_url')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
