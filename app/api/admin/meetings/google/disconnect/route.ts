/**
 * Google Calendar Disconnect API
 * 
 * POST /api/admin/meetings/google/disconnect
 * Disconnects the user's Google Calendar (deletes stored tokens)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { disconnectGoogleCalendar } from '@/lib/google-calendar';

export async function POST() {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role ?? '';
    const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(role, permissions, 'meetings:create')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Disconnect Google Calendar
    const disconnected = await disconnectGoogleCalendar(userId);

    if (!disconnected) {
      return NextResponse.json(
        { error: 'disconnect_failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error disconnecting Google Calendar:', err);
    return NextResponse.json(
      { error: 'internal_error', message: err.message },
      { status: 500 }
    );
  }
}
