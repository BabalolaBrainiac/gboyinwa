import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';
import { type Permission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

// PUT - Update user permissions (superadmin only)
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    
    // Only superadmin can update permissions
    if (role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden - Only superadmin can update permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { permissions } = body as { permissions: Permission[] };

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // First, delete existing permissions
    const { error: deleteError } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', id);

    if (deleteError) {
      console.error('Error deleting permissions:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update permissions' },
        { status: 500 }
      );
    }

    // Then, insert new permissions
    if (permissions.length > 0) {
      const { error: insertError } = await supabase
        .from('user_permissions')
        .insert(
          permissions.map(perm => ({
            user_id: id,
            permission: perm,
          }))
        );

      if (insertError) {
        console.error('Error inserting permissions:', insertError);
        return NextResponse.json(
          { error: 'Failed to update permissions' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
