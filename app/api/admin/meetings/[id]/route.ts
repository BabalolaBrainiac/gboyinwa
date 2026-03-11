/**
 * Meeting API - Get, update, or delete a specific meeting
 * 
 * GET /api/admin/meetings/[id] - Get meeting details
 * PATCH /api/admin/meetings/[id] - Update meeting
 * DELETE /api/admin/meetings/[id] - Delete meeting
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getMeetingById, updateMeeting, deleteMeeting } from '@/lib/meetings';

// GET /api/admin/meetings/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'meetings:view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const meeting = await getMeetingById(params.id);
    
    if (!meeting) {
      return NextResponse.json({ error: 'meeting not found' }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (err: any) {
    console.error('Error fetching meeting:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// PATCH /api/admin/meetings/[id]
export async function PATCH(
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
    const { title, description, meet_link, start_time, end_time, timezone, status } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (meet_link !== undefined) updates.meet_link = meet_link;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (timezone !== undefined) updates.timezone = timezone;
    if (status !== undefined) updates.status = status;

    const meeting = await updateMeeting(params.id, updates);

    if (!meeting) {
      return NextResponse.json({ error: 'meeting not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (err: any) {
    console.error('Error updating meeting:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// DELETE /api/admin/meetings/[id]
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

  if (!hasPermission(role, permissions, 'meetings:delete')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const success = await deleteMeeting(params.id);

    if (!success) {
      return NextResponse.json({ error: 'meeting not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting meeting:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
