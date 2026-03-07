import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';
import { uploadToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

// PUT — update display_name and/or avatar
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role?: string }).role;
    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getServiceClient();

    // Verify target user exists and is not superadmin (can't edit another superadmin)
    const { data: target } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const contentType = request.headers.get('content-type') || '';
    const updates: Record<string, string> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const displayName = formData.get('display_name') as string | null;
      const avatar = formData.get('avatar') as File | null;

      if (displayName !== null) {
        const safe = displayName.trim().replace(/<[^>]*>/g, '').substring(0, 100);
        if (safe) updates.display_name = safe;
      }

      if (avatar && avatar.size > 0) {
        if (!avatar.type.startsWith('image/')) {
          return NextResponse.json({ error: 'Avatar must be an image' }, { status: 400 });
        }
        if (avatar.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'Avatar must be under 5 MB' }, { status: 400 });
        }
        const bytes = await avatar.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `avatar_${id}.${ext}`;
        const { url } = await uploadToR2(buffer, fileName, avatar.type, 'avatars', '/');
        updates.avatar_url = url;
      }
    } else {
      const body = await request.json();
      if (body.display_name !== undefined) {
        const safe = String(body.display_name).trim().replace(/<[^>]*>/g, '').substring(0, 100);
        if (safe) updates.display_name = safe;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, role, display_name, avatar_url, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[users:PUT]', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE — remove admin user (superadmin only, cannot delete self)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role?: string }).role;
    const selfId = (session.user as { id?: string }).id;

    if (role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (id === selfId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: target } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (target.role === 'superadmin') {
      return NextResponse.json({ error: 'Cannot delete another superadmin' }, { status: 400 });
    }

    // Delete permissions first (FK)
    await supabase.from('user_permissions').delete().eq('user_id', id);

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[users:DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
