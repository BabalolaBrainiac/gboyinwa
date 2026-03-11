/**
 * Google Calendar Connect API
 * 
 * GET /api/admin/meetings/google/connect
 * Returns the Google OAuth URL for the user to authorize
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getAuthUrl, isGoogleCalendarConfigured } from '@/lib/google-calendar';

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
    if (!hasPermission(role, permissions, 'meetings:create')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Check if Google Calendar is configured
    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json(
        { error: 'google_calendar_not_configured' },
        { status: 503 }
      );
    }

    // Generate OAuth URL
    const authUrl = getAuthUrl(userId);

    return NextResponse.json({ authUrl });
  } catch (err: any) {
    console.error('Error generating auth URL:', err);
    return NextResponse.json(
      { error: 'internal_error', message: err.message },
      { status: 500 }
    );
  }
}
