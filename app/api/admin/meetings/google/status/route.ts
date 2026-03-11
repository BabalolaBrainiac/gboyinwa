/**
 * Google Calendar Status API
 * 
 * GET /api/admin/meetings/google/status
 * Checks if the current user has connected Google Calendar
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { hasGoogleCalendarConnected, isGoogleCalendarConfigured } from '@/lib/google-calendar';

export async function GET() {
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
    if (!hasPermission(role, permissions, 'meetings:view')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Check configuration status
    const isConfigured = isGoogleCalendarConfigured();
    
    // Check if user has connected
    const isConnected = isConfigured ? await hasGoogleCalendarConnected(userId) : false;

    return NextResponse.json({
      isConfigured,
      isConnected,
    });
  } catch (err: any) {
    console.error('Error checking Google Calendar status:', err);
    return NextResponse.json(
      { error: 'internal_error', message: err.message },
      { status: 500 }
    );
  }
}
