/**
 * Google Calendar API Integration
 * 
 * This module handles:
 * - OAuth2 authentication flow for Google Calendar
 * - Creating calendar events with Google Meet conference data
 * - Storing and refreshing access tokens
 * 
 * Setup Instructions:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable the Google Calendar API
 * 4. Configure OAuth consent screen (External type for testing)
 * 5. Add scopes: https://www.googleapis.com/auth/calendar.events
 * 6. Create OAuth 2.0 credentials (Web application)
 * 7. Add authorized redirect URI: https://yourdomain.com/api/auth/google/callback
 * 8. Copy Client ID and Client Secret to .env.local
 */

import { google, calendar_v3 } from 'googleapis';
import { getServiceClient, hasSupabaseEnv } from './supabase';

// =============================================================================
// CONFIGURATION
// =============================================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Scopes needed for creating calendar events with Meet
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

// =============================================================================
// TYPES
// =============================================================================

export type GoogleAuthTokens = {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
};

export type CreateCalendarEventInput = {
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  timezone?: string;
  attendees?: string[]; // Email addresses
  createMeetLink?: boolean;
};

export type CalendarEventResult = {
  success: boolean;
  eventId?: string;
  meetLink?: string;
  htmlLink?: string;
  error?: string;
};

// =============================================================================
// OAUTH2 CLIENT
// =============================================================================

export function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${NEXTAUTH_URL}/api/auth/google/callback`
  );
}

/**
 * Generate the OAuth2 authorization URL
 * User visits this URL to grant permissions
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh token
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token every time
    state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<GoogleAuthTokens> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
    scope: tokens.scope!,
    token_type: tokens.token_type!,
  };
}

// =============================================================================
// TOKEN STORAGE (DATABASE)
// =============================================================================

/**
 * Store Google tokens for a user
 */
export async function storeUserGoogleTokens(
  userId: string,
  tokens: GoogleAuthTokens
): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  
  const supabase = getServiceClient();
  
  // Check if table exists, create if not
  const { error: tableError } = await supabase
    .from('user_google_tokens')
    .select('id')
    .limit(1);
  
  // If table doesn't exist, we need to create it
  if (tableError && tableError.message.includes('does not exist')) {
    // Table will be created via migration
    return false;
  }
  
  const { error } = await supabase
    .from('user_google_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      token_type: tokens.token_type,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });
  
  if (error) {
    console.error('Error storing Google tokens:', error);
    return false;
  }
  
  return true;
}

/**
 * Get stored Google tokens for a user
 */
export async function getUserGoogleTokens(userId: string): Promise<GoogleAuthTokens | null> {
  if (!hasSupabaseEnv()) return null;
  
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: data.expiry_date,
    scope: data.scope,
    token_type: data.token_type,
  };
}

/**
 * Check if user has connected Google Calendar
 */
export async function hasGoogleCalendarConnected(userId: string): Promise<boolean> {
  const tokens = await getUserGoogleTokens(userId);
  return tokens !== null;
}

/**
 * Delete stored Google tokens for a user
 */
export async function disconnectGoogleCalendar(userId: string): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  
  const supabase = getServiceClient();
  
  const { error } = await supabase
    .from('user_google_tokens')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return false;
  }
  
  return true;
}

// =============================================================================
// TOKEN REFRESH
// =============================================================================

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expiry_date: number } | null> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      access_token: credentials.access_token!,
      expiry_date: credentials.expiry_date!,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

/**
 * Get valid access token (refresh if expired)
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokens = await getUserGoogleTokens(userId);
  
  if (!tokens) {
    return null;
  }
  
  // Check if token is expired (with 5 minute buffer)
  const isExpired = Date.now() >= tokens.expiry_date - 5 * 60 * 1000;
  
  if (isExpired) {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    
    if (!refreshed) {
      return null;
    }
    
    // Update stored tokens
    await storeUserGoogleTokens(userId, {
      ...tokens,
      access_token: refreshed.access_token,
      expiry_date: refreshed.expiry_date,
    });
    
    return refreshed.access_token;
  }
  
  return tokens.access_token;
}

// =============================================================================
// CALENDAR EVENTS
// =============================================================================

/**
 * Create a calendar event with Google Meet
 */
export async function createCalendarEvent(
  userId: string,
  input: CreateCalendarEventInput
): Promise<CalendarEventResult> {
  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(userId);
    
    if (!accessToken) {
      return {
        success: false,
        error: 'Google Calendar not connected. Please connect your Google account first.',
      };
    }
    
    // Set up OAuth2 client with access token
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Ensure datetime format includes seconds (Google Calendar API requires ISO 8601 with seconds)
    const formatDateTime = (dt: string) => {
      // If the datetime doesn't have seconds, add :00
      if (dt.length === 16) { // YYYY-MM-DDTHH:MM
        return dt + ':00';
      }
      return dt;
    };

    // Build event object
    const event: calendar_v3.Schema$Event = {
      summary: input.title,
      description: input.description || undefined,
      start: {
        dateTime: formatDateTime(input.startTime),
        timeZone: input.timezone || 'UTC',
      },
      end: {
        dateTime: formatDateTime(input.endTime),
        timeZone: input.timezone || 'UTC',
      },
      attendees: input.attendees?.map(email => ({ email })),
    };
    
    // Add Google Meet conference if requested
    if (input.createMeetLink !== false) {
      event.conferenceData = {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }
    
    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: input.createMeetLink !== false ? 1 : 0,
    });
    
    const createdEvent = response.data;
    
    return {
      success: true,
      eventId: createdEvent.id!,
      meetLink: createdEvent.conferenceData?.entryPoints?.[0]?.uri || createdEvent.hangoutLink || '',
      htmlLink: createdEvent.htmlLink!,
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    
    // Handle specific errors
    if (error.code === 401) {
      return {
        success: false,
        error: 'Google authentication expired. Please reconnect your Google account.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create calendar event',
    };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    if (!accessToken) {
      return false;
    }
    
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  input: Partial<CreateCalendarEventInput>
): Promise<CalendarEventResult> {
  try {
    const accessToken = await getValidAccessToken(userId);
    
    if (!accessToken) {
      return {
        success: false,
        error: 'Google Calendar not connected',
      };
    }
    
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Ensure datetime format includes seconds
    const formatDateTime = (dt: string) => {
      if (dt.length === 16) { // YYYY-MM-DDTHH:MM
        return dt + ':00';
      }
      return dt;
    };

    // Build patch object
    const event: calendar_v3.Schema$Event = {};
    
    if (input.title !== undefined) event.summary = input.title;
    if (input.description !== undefined) event.description = input.description || undefined;
    if (input.startTime !== undefined) {
      event.start = {
        dateTime: formatDateTime(input.startTime),
        timeZone: input.timezone || 'UTC',
      };
    }
    if (input.endTime !== undefined) {
      event.end = {
        dateTime: formatDateTime(input.endTime),
        timeZone: input.timezone || 'UTC',
      };
    }
    if (input.attendees !== undefined) {
      event.attendees = input.attendees.map(email => ({ email }));
    }
    
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });
    
    const updatedEvent = response.data;
    
    return {
      success: true,
      eventId: updatedEvent.id!,
      meetLink: updatedEvent.conferenceData?.entryPoints?.[0]?.uri || updatedEvent.hangoutLink || '',
      htmlLink: updatedEvent.htmlLink!,
    };
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to update calendar event',
    };
  }
}

// =============================================================================
// SETUP CHECK
// =============================================================================

export function isGoogleCalendarConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET;
}

export function getSetupInstructions(): string {
  return `
Google Calendar API Setup Instructions:

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable the Google Calendar API:
   - APIs & Services > Library
   - Search "Google Calendar API"
   - Click Enable

4. Configure OAuth consent screen:
   - APIs & Services > OAuth consent screen
   - Select "External" (or "Internal" for Workspace)
   - Fill in app name: "Gboyinwa"
   - Add user support email
   - Add developer contact email
   - Add scope: https://www.googleapis.com/auth/calendar.events
   - Add test users (your email)

5. Create OAuth 2.0 credentials:
   - APIs & Services > Credentials
   - Create Credentials > OAuth client ID
   - Application type: Web application
   - Name: "Gboyinwa Web"
   - Authorized redirect URIs:
     * http://localhost:3000/api/auth/google/callback (development)
     * https://yourdomain.com/api/auth/google/callback (production)
   - Click Create

6. Copy credentials to .env.local:
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret

7. Run the database migration to create user_google_tokens table

8. Visit /admin/meetings and click "Connect Google Calendar"
`;
}
