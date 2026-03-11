/**
 * Send Meeting Invites API
 * 
 * POST /api/admin/meetings/[id]/send-invites - Send invites to all or specific participants
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { sendMeetingInvites } from '@/lib/meetings';

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

  if (!hasPermission(role, permissions, 'meetings:send_invites')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { participant_ids } = body;

    const results = await sendMeetingInvites(params.id, participant_ids);

    return NextResponse.json({
      success: results.failed === 0,
      ...results,
    });
  } catch (err: any) {
    console.error('Error sending invites:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
