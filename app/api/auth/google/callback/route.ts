/**
 * Google OAuth Callback Handler
 * 
 * This route handles the OAuth callback from Google after user authorization.
 * It exchanges the authorization code for tokens and stores them in the database.
 * 
 * Flow:
 * 1. User clicks "Connect Google Calendar" in admin
 * 2. Redirected to Google's OAuth consent screen
 * 3. Google redirects back here with authorization code
 * 4. We exchange code for tokens and store them
 * 5. Redirect user back to meetings page
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getTokensFromCode, 
  storeUserGoogleTokens,
  isGoogleCalendarConfigured 
} from '@/lib/google-calendar';

export async function GET(request: Request) {
  try {
    // Check if Google Calendar is configured
    if (!isGoogleCalendarConfigured()) {
      return NextResponse.redirect(
        new URL('/admin/meetings?error=google_not_configured', request.url)
      );
    }

    // Get current user session
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId) {
      return NextResponse.redirect(
        new URL('/login?callbackUrl=/admin/meetings', request.url)
      );
    }

    // Get authorization code from URL
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/admin/meetings?error=oauth_denied`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/meetings?error=no_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Store tokens in database
    const stored = await storeUserGoogleTokens(userId, tokens);

    if (!stored) {
      return NextResponse.redirect(
        new URL('/admin/meetings?error=storage_failed', request.url)
      );
    }

    // Redirect back to meetings page with success message
    return NextResponse.redirect(
      new URL('/admin/meetings?success=google_connected', request.url)
    );
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    
    // Handle specific errors
    if (err.message?.includes('invalid_grant')) {
      return NextResponse.redirect(
        new URL('/admin/meetings?error=expired_code', request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/admin/meetings?error=unknown', request.url)
    );
  }
}
