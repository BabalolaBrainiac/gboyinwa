/**
 * Meetings Library - Google Meet Integration for Gboyinwa
 * 
 * Features:
 * - Create meetings with Google Meet links
 * - Manage meeting participants
 * - Send meeting invitations via email
 * 
 * Note: Google Meet links are generated via Google Calendar API or manually.
 * This module handles the storage and invitation system.
 */

import { getServiceClient, hasSupabaseEnv } from './supabase';
import { sendCampaignEmail } from './resend';
import { decryptPii } from './encrypt';

// =============================================================================
// TYPES
// =============================================================================

export type Meeting = {
  id: string;
  title: string;
  description: string | null;
  meet_link: string;
  start_time: string;
  end_time: string;
  timezone: string;
  created_by: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type MeetingParticipant = {
  id: string;
  meeting_id: string;
  user_id: string;
  status: 'invited' | 'accepted' | 'declined' | 'tentative';
  invited_at: string;
  responded_at: string | null;
  user?: {
    id: string;
    display_name: string | null;
    email_encrypted: string | null;
  };
};

export type MeetingWithParticipants = Meeting & {
  participants: MeetingParticipant[];
  creator?: {
    id: string;
    display_name: string | null;
  };
};

export type CreateMeetingInput = {
  title: string;
  description?: string | null;
  meet_link: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  participant_ids: string[];
};

// =============================================================================
// MEETING OPERATIONS
// =============================================================================

export async function getMeetings(): Promise<Meeting[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('start_time', { ascending: false });
  
  if (error) {
    console.error('Error fetching meetings:', error);
    return [];
  }
  
  return data ?? [];
}

export async function getMeetingById(id: string): Promise<MeetingWithParticipants | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = getServiceClient();
  
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(`
      *,
      participants:meeting_participants(
        *,
        user:users(id, display_name, email_encrypted)
      ),
      creator:users!meetings_created_by_fkey(id, display_name)
    `)
    .eq('id', id)
    .single();
  
  if (error || !meeting) {
    console.error('Error fetching meeting:', error);
    return null;
  }
  
  return meeting as MeetingWithParticipants;
}

export async function createMeeting(
  input: CreateMeetingInput,
  createdBy: string
): Promise<Meeting | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = getServiceClient();
  
  // Insert meeting
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .insert({
      title: input.title,
      description: input.description ?? null,
      meet_link: input.meet_link,
      start_time: input.start_time,
      end_time: input.end_time,
      timezone: input.timezone ?? 'UTC',
      created_by: createdBy,
      status: 'scheduled',
    })
    .select()
    .single();
  
  if (meetingError || !meeting) {
    console.error('Error creating meeting:', meetingError);
    return null;
  }
  
  // Add participants
  if (input.participant_ids.length > 0) {
    const participantRecords = input.participant_ids.map(userId => ({
      meeting_id: meeting.id,
      user_id: userId,
      status: 'invited',
    }));
    
    const { error: participantError } = await supabase
      .from('meeting_participants')
      .insert(participantRecords);
    
    if (participantError) {
      console.error('Error adding participants:', participantError);
    }
  }
  
  return meeting;
}

export async function updateMeeting(
  id: string,
  updates: Partial<Omit<Meeting, 'id' | 'created_at' | 'created_by'>>
): Promise<Meeting | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('meetings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating meeting:', error);
    return null;
  }
  
  return data;
}

export async function deleteMeeting(id: string): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = getServiceClient();
  
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting meeting:', error);
    return false;
  }
  
  return true;
}

// =============================================================================
// PARTICIPANT OPERATIONS
// =============================================================================

export async function addParticipants(
  meetingId: string,
  userIds: string[]
): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = getServiceClient();
  
  const records = userIds.map(userId => ({
    meeting_id: meetingId,
    user_id: userId,
    status: 'invited',
  }));
  
  const { error } = await supabase
    .from('meeting_participants')
    .insert(records);
  
  if (error) {
    console.error('Error adding participants:', error);
    return false;
  }
  
  return true;
}

export async function removeParticipant(
  meetingId: string,
  userId: string
): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = getServiceClient();
  
  const { error } = await supabase
    .from('meeting_participants')
    .delete()
    .eq('meeting_id', meetingId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error removing participant:', error);
    return false;
  }
  
  return true;
}

export async function updateParticipantStatus(
  meetingId: string,
  userId: string,
  status: MeetingParticipant['status']
): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = getServiceClient();
  
  const { error } = await supabase
    .from('meeting_participants')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('meeting_id', meetingId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error updating participant status:', error);
    return false;
  }
  
  return true;
}

// =============================================================================
// EMAIL TEMPLATES & SENDING
// =============================================================================

export function generateMeetingInviteEmail(params: {
  meetingTitle: string;
  meetingDescription: string | null;
  meetLink: string;
  startTime: string;
  endTime: string;
  timezone: string;
  organizerName: string;
  participantName?: string;
}): { html: string; text: string } {
  const greeting = params.participantName ? `Hi ${params.participantName},` : 'Hi there,';
  
  // Format date/time
  const startDate = new Date(params.startTime);
  const endDate = new Date(params.endTime);
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Invitation: ${params.meetingTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .content { background: #fff; border-radius: 8px; }
    .meeting-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .meeting-title { font-size: 20px; font-weight: bold; color: #1a1a1a; margin-bottom: 10px; }
    .meeting-details { color: #666; margin-bottom: 15px; }
    .meeting-details strong { color: #333; }
    .cta-button { display: inline-block; background: #1a73e8; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 10px 0; }
    .cta-button:hover { background: #1557b0; }
    .meet-link { word-break: break-all; color: #1a73e8; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
    .footer a { color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Gboyinwa</div>
  </div>
  <div class="content">
    <p>${greeting}</p>
    <p><strong>${params.organizerName}</strong> has invited you to a meeting.</p>
    
    <div class="meeting-card">
      <div class="meeting-title">${params.meetingTitle}</div>
      ${params.meetingDescription ? `<div class="meeting-details">${params.meetingDescription}</div>` : ''}
      <div class="meeting-details">
        <strong>📅 Date:</strong> ${dateStr}<br>
        <strong>🕐 Time:</strong> ${timeStr}<br>
        <strong>🌍 Timezone:</strong> ${params.timezone}
      </div>
      <a href="${params.meetLink}" class="cta-button">Join Google Meet</a>
      <p style="margin-top: 15px; font-size: 13px; color: #666;">
        Or join using this link:<br>
        <a href="${params.meetLink}" class="meet-link">${params.meetLink}</a>
      </p>
    </div>
    
    <p>Please let us know if you can attend by responding to this invitation.</p>
  </div>
  <div class="footer">
    <p>This meeting invitation was sent from Gboyinwa.</p>
    <p><a href="https://gboyinwa.com">Visit Website</a></p>
  </div>
</body>
</html>`;

  const text = `${greeting}

${params.organizerName} has invited you to a meeting.

Meeting: ${params.meetingTitle}
${params.meetingDescription ? `Description: ${params.meetingDescription}\n` : ''}Date: ${dateStr}
Time: ${timeStr}
Timezone: ${params.timezone}

Join Google Meet: ${params.meetLink}

Please let us know if you can attend.

---
Gboyinwa
https://gboyinwa.com`;

  return { html, text };
}

export async function sendMeetingInvites(
  meetingId: string,
  participantUserIds?: string[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!hasSupabaseEnv()) return { sent: 0, failed: 0, errors: ['Supabase not configured'] };
  
  const supabase = getServiceClient();
  
  // Get meeting details with participants
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select(`
      *,
      creator:users!meetings_created_by_fkey(id, display_name)
    `)
    .eq('id', meetingId)
    .single();
  
  if (meetingError || !meeting) {
    return { sent: 0, failed: 0, errors: ['Meeting not found'] };
  }
  
  // Get participants
  let query = supabase
    .from('meeting_participants')
    .select(`
      *,
      user:users(id, display_name, email_encrypted)
    `)
    .eq('meeting_id', meetingId);
  
  if (participantUserIds && participantUserIds.length > 0) {
    query = query.in('user_id', participantUserIds);
  }
  
  const { data: participants, error: participantsError } = await query;
  
  if (participantsError || !participants || participants.length === 0) {
    return { sent: 0, failed: 0, errors: ['No participants found'] };
  }
  
  const results = { sent: 0, failed: 0, errors: [] as string[] };
  const organizerName = meeting.creator?.display_name || 'Gboyinwa Team';
  
  for (const participant of participants) {
    const user = participant.user as { id: string; display_name: string | null; email_encrypted: string | null } | null;
    if (!user?.email_encrypted) {
      results.failed++;
      results.errors.push(`No email for user ${user?.id || participant.user_id}`);
      continue;
    }
    
    const email = decryptPii(user.email_encrypted);
    if (!email) {
      results.failed++;
      results.errors.push(`Could not decrypt email for user ${user.id}`);
      continue;
    }
    
    const { html, text } = generateMeetingInviteEmail({
      meetingTitle: meeting.title,
      meetingDescription: meeting.description,
      meetLink: meeting.meet_link,
      startTime: meeting.start_time,
      endTime: meeting.end_time,
      timezone: meeting.timezone,
      organizerName,
      participantName: user.display_name || undefined,
    });
    
    const result = await sendCampaignEmail({
      to: email,
      subject: `Meeting Invitation: ${meeting.title}`,
      html,
      text,
      tags: [
        { name: 'type', value: 'meeting_invite' },
        { name: 'meeting_id', value: meetingId },
      ],
    });
    
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${email}: ${result.error}`);
    }
  }
  
  return results;
}

// =============================================================================
// STAFF LOOKUP
// =============================================================================

export type StaffMember = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
};

export async function getStaffMembers(): Promise<StaffMember[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, email_encrypted, role')
    .in('role', ['admin', 'superadmin'])
    .order('display_name', { ascending: true });
  
  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
  
  return (data ?? []).map(user => ({
    id: user.id,
    display_name: user.display_name,
    email: user.email_encrypted ? decryptPii(user.email_encrypted) : null,
    role: user.role,
  }));
}

// =============================================================================
// GOOGLE MEET LINK GENERATION
// =============================================================================

/**
 * Generates a Google Meet link.
 * 
 * Option 1: Use Google Calendar API (requires OAuth + GCP project)
 * Option 2: Generate a random Meet-style link (for manual entry)
 * Option 3: Return empty and let user paste their own link
 * 
 * For now, we return null and let the user provide the link.
 * In production, you could integrate with Google Calendar API.
 */
export function generateMeetLink(): string | null {
  // Placeholder - in production, integrate with Google Calendar API
  // See: https://developers.google.com/calendar/api/v3/reference/events/insert
  return null;
}

/**
 * Instructions for generating Google Meet links:
 * 
 * 1. Manual: Create meeting in Google Calendar, copy the Meet link
 * 2. API: Set up Google Calendar API with OAuth2
 *    - Create OAuth credentials in Google Cloud Console
 *    - Enable Google Calendar API
 *    - Use service account or user OAuth flow
 *    - Call events.insert with conferenceData
 */
export const GOOGLE_MEET_SETUP_GUIDE = `
To generate Google Meet links automatically:

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials
5. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env
6. Implement OAuth flow for admin users
7. Use Calendar API to create events with conference data
`;
