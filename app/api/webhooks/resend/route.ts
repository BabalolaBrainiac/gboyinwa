/**
 * Resend Webhook Handler
 * 
 * Receives delivery events from Resend:
 * - email.sent
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 * 
 * Updates campaign_recipients table with engagement data
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { type ResendWebhookPayload } from '@/lib/resend';

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(request: Request) {
  // Verify signature if secret is configured
  if (WEBHOOK_SECRET) {
    const signature = request.headers.get('x-resend-signature');
    const body = await request.text();
    
    // In production, verify the signature
    // @see https://resend.com/docs/dashboard/webhooks#verifying-webhooks
    // For now, we accept all requests
  }

  let payload: ResendWebhookPayload;
  
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    const { type, data } = payload;
    const messageId = data.id;

    // Find the campaign recipient by message ID
    const { data: recipient } = await supabase
      .from('campaign_recipients')
      .select('id')
      .eq('external_message_id', messageId)
      .single();

    if (!recipient) {
      // Message not found in our system, might be transactional
      return NextResponse.json({ received: true });
    }

    switch (type) {
      case 'email.sent':
        await supabase
          .from('campaign_recipients')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', recipient.id);
        break;

      case 'email.delivered':
        await supabase
          .from('campaign_recipients')
          .update({ status: 'delivered' })
          .eq('id', recipient.id);
        break;

      case 'email.opened':
        await supabase
          .from('campaign_recipients')
          .update({
            opened_at: new Date(data.open?.timestamp || Date.now()).toISOString(),
            open_count: supabase.rpc('increment', { row_id: recipient.id }),
          })
          .eq('id', recipient.id);
        break;

      case 'email.clicked':
        await supabase
          .from('campaign_recipients')
          .update({
            clicked_at: new Date(data.click?.timestamp || Date.now()).toISOString(),
            click_count: supabase.rpc('increment', { row_id: recipient.id }),
            links_clicked: supabase.rpc('append_link', {
              row_id: recipient.id,
              link: data.click?.link,
            }),
          })
          .eq('id', recipient.id);
        break;

      case 'email.bounced':
        await supabase
          .from('campaign_recipients')
          .update({
            status: 'bounced',
            error_message: data.bounce?.reason || 'Bounced',
          })
          .eq('id', recipient.id);
        break;

      case 'email.complained':
        await supabase
          .from('campaign_recipients')
          .update({ status: 'complained' })
          .eq('id', recipient.id);
        
        // Optionally unsubscribe the user
        // await supabase.from('subscribers').update({ status: 'unsubscribed' })...
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'processing error' }, { status: 500 });
  }
}
