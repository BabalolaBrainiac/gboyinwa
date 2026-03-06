/**
 * Subscription Confirmation API
 * 
 * GET /api/subscribe/confirm?token=xxx - Confirm subscription
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { sendCampaignEmail, generateWelcomeEmail } from '@/lib/resend';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    // Find subscriber by confirmation token
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('id, status, email_encrypted, first_name')
      .eq('confirmation_token', token)
      .single();

    if (error || !subscriber) {
      return NextResponse.json({ 
        error: 'invalid or expired confirmation token' 
      }, { status: 400 });
    }

    if (subscriber.status === 'active') {
      return NextResponse.json({ 
        message: 'Your subscription is already confirmed.' 
      });
    }

    if (subscriber.status === 'unsubscribed') {
      return NextResponse.json({ 
        error: 'This subscription has been cancelled. Please subscribe again.' 
      }, { status: 400 });
    }

    // Activate subscription
    await supabase
      .from('subscribers')
      .update({
        status: 'active',
        confirmed_at: new Date().toISOString(),
        confirmation_token: null, // Clear token after use
      })
      .eq('id', subscriber.id);

    // Send welcome email
    const baseUrl = process.env.NEXTAUTH_URL || 'https://gboyinwa.com';
    const { html, text } = generateWelcomeEmail({
      firstName: subscriber.first_name || undefined,
      blogUrl: `${baseUrl}/blog`,
    });

    // Decrypt email for sending
    let email: string | null = null;
    if (subscriber.email_encrypted) {
      try {
        const { decryptPii } = await import('@/lib/encrypt');
        email = decryptPii(subscriber.email_encrypted);
      } catch {
        // Ignore decryption errors
      }
    }

    if (email) {
      await sendCampaignEmail({
        to: email,
        subject: 'Welcome to Gboyinwa!',
        html,
        text,
      });
    }

    return NextResponse.json({
      message: 'Your subscription has been confirmed! Welcome to our community.',
      success: true,
    });
  } catch (err: any) {
    console.error('Confirmation error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
