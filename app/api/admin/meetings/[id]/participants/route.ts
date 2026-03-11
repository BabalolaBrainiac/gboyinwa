/**
 * Meeting Participants API
 * 
 * POST /api/admin/meetings/[id]/participants - Add participants to a meeting
 * DELETE /api/admin/meetings/[id]/participants - Remove participants from a meeting
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { addParticipants, removeParticipant, getStaffMembers, sendMeetingInvites } from '@/lib/meetings';

// POST /api/admin/meetings/[id]/participants
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'meetings:edit')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { user_ids, send_invites } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: 'user_ids array is required' },
        { status: 400 }
      );
    }

    // Validate user_ids are valid staff members
    const staff = await getStaffMembers();
    const validStaffIds = new Set(staff.map(s => s.id));
    const invalidIds = user_ids.filter((id: string) => !validStaffIds.has(id));
    
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Invalid participant IDs', invalidIds },
        { status: 400 }
      );
    }

    const success = await addParticipants(params.id, user_ids);

    if (!success) {
      return NextResponse.json(
        { error: 'failed to add participants' },
        { status: 500 }
      );
    }

    // Send invites if requested
    let inviteResults = null;
    if (send_invites) {
      if (!hasPermission(role, permissions, 'meetings:send_invites')) {
        return NextResponse.json(
          { error: 'forbidden - cannot send invites' },
          { status: 403 }
        );
      }

      inviteResults = await sendMeetingInvites(params.id, user_ids);
    }

    return NextResponse.json({
      success: true,
      added: user_ids.length,
      invites: inviteResults,
    });
  } catch (err: any) {
    console.error('Error adding participants:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// DELETE /api/admin/meetings/[id]/participants
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'meetings:edit')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      );
    }

    const success = await removeParticipant(params.id, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'failed to remove participant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error removing participant:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
