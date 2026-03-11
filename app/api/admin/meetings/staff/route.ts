/**
 * Staff Members API for Meetings
 * 
 * GET /api/admin/meetings/staff - Get list of staff members for participant selection
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getStaffMembers } from '@/lib/meetings';

export async function GET() {
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
    const staff = await getStaffMembers();
    return NextResponse.json(staff);
  } catch (err: any) {
    console.error('Error fetching staff:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
