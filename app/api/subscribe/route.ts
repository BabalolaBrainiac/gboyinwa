/**
 * Public Subscribe API
 * 
 * POST /api/subscribe - Subscribe to blog
 * Body: { email: string, firstName?: string, lastName?: string }
 * 
 * Double opt-in flow:
 * 1. User submits email
 * 2. Confirmation email sent
 * 3. User clicks confirmation link
 * 4. Status changed to active
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { hashEmail } from '@/lib/hash';
import { encryptPii } from '@/lib/encrypt';
import { sendCampaignEmail, generateSubscriptionConfirmationEmail } from '@/lib/resend';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  
  const { email, firstName, lastName, source = 'website' } = body;

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'invalid email format' }, { status: 400 });
  }

  const emailNorm = email.trim().toLowerCase();
  const emailHash = hashEmail(emailNorm);

  const supabase = getServiceClient();

  try {
    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, status, confirmation_token')
      .eq('email_hash', emailHash)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ 
          message: 'You are already subscribed!',
          alreadySubscribed: true 
        });
      }

      if (existing.status === 'pending') {
        // Resend confirmation email
        const baseUrl = process.env.NEXTAUTH_URL || 'https://gboyinwa.com';
        const confirmationUrl = `${baseUrl}/confirm?token=${existing.confirmation_token}`;
        
        const { html, text } = generateSubscriptionConfirmationEmail({
          confirmationUrl,
          firstName,
        });

        await sendCampaignEmail({
          to: emailNorm,
          subject: 'Confirm Your Subscription',
          html,
          text,
        });

        return NextResponse.json({
          message: 'Confirmation email resent. Please check your inbox.',
          pending: true,
        });
      }

      if (existing.status === 'unsubscribed') {
        // Reactivate - will need new confirmation
        const confirmationToken = randomBytes(32).toString('hex');
        
        await supabase
          .from('subscribers')
          .update({
            status: 'pending',
            confirmation_token: confirmationToken,
            confirmation_sent_at: new Date().toISOString(),
            unsubscribed_at: null,
            first_name: firstName || null,
            last_name: lastName || null,
          })
          .eq('id', existing.id);

        // Send confirmation email
        const baseUrl = process.env.NEXTAUTH_URL || 'https://gboyinwa.com';
        const confirmationUrl = `${baseUrl}/confirm?token=${confirmationToken}`;
        
        const { html, text } = generateSubscriptionConfirmationEmail({
          confirmationUrl,
          firstName,
        });

        await sendCampaignEmail({
          to: emailNorm,
          subject: 'Confirm Your Subscription',
          html,
          text,
        });

        return NextResponse.json({
          message: 'Please confirm your subscription via the email we sent.',
          pending: true,
        });
      }
    }

    // Create new subscriber
    const confirmationToken = randomBytes(32).toString('hex');
    const unsubscribeToken = randomBytes(32).toString('hex');

    let emailEncrypted: string;
    try {
      emailEncrypted = encryptPii(emailNorm);
    } catch {
      // Encryption not configured, still allow subscription
      emailEncrypted = '';
    }

    const { error: insertError } = await supabase.from('subscribers').insert({
      email_hash: emailHash,
      email_encrypted: emailEncrypted,
      first_name: firstName || null,
      last_name: lastName || null,
      status: 'pending',
      source,
      confirmation_token: confirmationToken,
      confirmation_sent_at: new Date().toISOString(),
      unsubscribe_token: unsubscribeToken,
    });

    if (insertError) {
      console.error('Subscriber insert error:', insertError);
      return NextResponse.json({ error: 'failed to create subscription' }, { status: 500 });
    }

    // Send confirmation email
    const baseUrl = process.env.NEXTAUTH_URL || 'https://gboyinwa.com';
    const confirmationUrl = `${baseUrl}/confirm?token=${confirmationToken}`;
    
    const { html, text } = generateSubscriptionConfirmationEmail({
      confirmationUrl,
      firstName,
    });

    const sendResult = await sendCampaignEmail({
      to: emailNorm,
      subject: 'Confirm Your Subscription',
      html,
      text,
    });

    if (!sendResult.success) {
      console.error('Failed to send confirmation email:', sendResult.error);
      // Delete the subscriber record since email failed
      await supabase.from('subscribers').delete().eq('email_hash', emailHash);
      return NextResponse.json({ 
        error: 'Failed to send confirmation email. Please try again later.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Please check your email to confirm your subscription.',
      pending: true,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
