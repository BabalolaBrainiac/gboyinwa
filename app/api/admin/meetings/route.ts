/**
 * Meetings API - Create and list meetings
 * 
 * GET /api/admin/meetings - List all meetings
 * POST /api/admin/meetings - Create a new meeting with participants
 * 
 * When user has Google Calendar connected and create_calendar_event is true,
 * automatically creates a Google Calendar event with Meet link.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';
import { createMeeting, getMeetings, sendMeetingInvites, getStaffMembers } from '@/lib/meetings';
import { createCalendarEvent, hasGoogleCalendarConnected } from '@/lib/google-calendar';

// GET /api/admin/meetings
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
    const meetings = await getMeetings();
    return NextResponse.json(meetings);
  } catch (err: any) {
    console.error('Error fetching meetings:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// POST /api/admin/meetings
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];
  const userId = (session?.user as { id?: string })?.id;

  if (!session || !userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'meetings:create')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      meet_link, 
      start_time, 
      end_time, 
      timezone, 
      participant_ids, 
      send_invites,
      create_calendar_event 
    } = body;

    // Validation
    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'title, start_time, and end_time are required' },
        { status: 400 }
      );
    }

    let finalMeetLink = meet_link;
    let calendarEventId: string | undefined;
    let calendarError: string | undefined;

    // Auto-create Google Calendar event with Meet link if requested
    if (create_calendar_event) {
      const isGoogleConnected = await hasGoogleCalendarConnected(userId);
      
      if (!isGoogleConnected) {
        return NextResponse.json(
          { error: 'Google Calendar not connected. Please connect your Google account first.' },
          { status: 400 }
        );
      }

      // Get participant emails for calendar invite
      let attendeeEmails: string[] = [];
      if (participant_ids && participant_ids.length > 0) {
        const staff = await getStaffMembers();
        attendeeEmails = staff
          .filter(s => participant_ids.includes(s.id) && s.email)
          .map(s => s.email!);
      }

      // Create calendar event
      const calendarResult = await createCalendarEvent(userId, {
        title,
        description: description || `Meeting organized via Gboyinwa`,
        startTime: start_time,
        endTime: end_time,
        timezone: timezone || 'UTC',
        attendees: attendeeEmails,
        createMeetLink: true,
      });

      if (calendarResult.success) {
        finalMeetLink = calendarResult.meetLink || '';
        calendarEventId = calendarResult.eventId;
      } else {
        calendarError = calendarResult.error;
        // Don't fail the whole request, just warn
      }
    }

    // Validate meet_link if not auto-created
    if (!finalMeetLink) {
      return NextResponse.json(
        { error: 'meet_link is required when not creating calendar event' },
        { status: 400 }
      );
    }

    // Validate participant_ids are valid staff members
    if (participant_ids && participant_ids.length > 0) {
      const staff = await getStaffMembers();
      const validStaffIds = new Set(staff.map(s => s.id));
      const invalidIds = participant_ids.filter((id: string) => !validStaffIds.has(id));
      
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: 'Invalid participant IDs', invalidIds },
          { status: 400 }
        );
      }
    }

    // Create meeting in database
    const meeting = await createMeeting(
      {
        title,
        description,
        meet_link: finalMeetLink,
        start_time,
        end_time,
        timezone: timezone ?? 'UTC',
        participant_ids: participant_ids ?? [],
      },
      userId
    );

    if (!meeting) {
      // Try to delete calendar event if database creation failed
      if (calendarEventId) {
        const { deleteCalendarEvent } = await import('@/lib/google-calendar');
        await deleteCalendarEvent(userId, calendarEventId);
      }
      return NextResponse.json({ error: 'failed to create meeting' }, { status: 500 });
    }

    // Store calendar event ID in meeting record (optional, for future sync)
    if (calendarEventId) {
      const supabase = getServiceClient();
      await supabase
        .from('meetings')
        .update({ 
          // You could add a calendar_event_id column if needed
          description: `${description || ''}\n\n[Calendar Event ID: ${calendarEventId}]`.trim()
        })
        .eq('id', meeting.id);
    }

    // Send invites if requested and user has permission
    let inviteResults = null;
    if (send_invites && participant_ids?.length > 0) {
      if (!hasPermission(role, permissions, 'meetings:send_invites')) {
        return NextResponse.json(
          { error: 'forbidden - cannot send invites' },
          { status: 403 }
        );
      }

      inviteResults = await sendMeetingInvites(meeting.id);
    }

    return NextResponse.json({
      meeting,
      invites: inviteResults,
      calendar: calendarEventId ? {
        created: true,
        eventId: calendarEventId,
        error: calendarError,
      } : {
        created: false,
      },
    });
  } catch (err: any) {
    console.error('Error creating meeting:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
