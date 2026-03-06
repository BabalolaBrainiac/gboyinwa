/**
 * Email Campaigns API
 * 
 * GET /api/admin/campaigns - List campaigns
 * POST /api/admin/campaigns - Create new campaign
 * 
 * Permissions:
 * - campaigns:view - to list
 * - campaigns:create - to create
 * - campaigns:send - to send campaigns
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';
import { sendBulkEmails, generateCampaignEmail, isResendConfigured, type CampaignEmailPayload } from '@/lib/resend';
import { encryptPii } from '@/lib/encrypt';
import { randomBytes } from 'crypto';

// List campaigns
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'campaigns:view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const recipientType = searchParams.get('recipient_type');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const supabase = getServiceClient();

  try {
    let query = supabase
      .from('v_campaign_stats')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (recipientType) {
      query = query.eq('recipient_type', recipientType);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Campaigns fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      campaigns: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (err: any) {
    console.error('Campaigns API error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// Create new campaign
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'campaigns:create')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const {
    name,
    subject,
    content,
    contentHtml,
    recipientType,
    sendNow = false,
    scheduledAt,
  } = body;

  // Validate
  if (!name || !subject || !content || !recipientType) {
    return NextResponse.json({ 
      error: 'name, subject, content, and recipientType are required' 
    }, { status: 400 });
  }

  if (!['staff', 'subscribers', 'all'].includes(recipientType)) {
    return NextResponse.json({ 
      error: 'recipientType must be staff, subscribers, or all' 
    }, { status: 400 });
  }

  // Check permissions for recipient type
  if (recipientType === 'staff' && !hasPermission(role, permissions, 'communications:send_staff')) {
    return NextResponse.json({ error: 'forbidden: cannot send to staff' }, { status: 403 });
  }

  if (recipientType === 'subscribers' && !hasPermission(role, permissions, 'communications:send_subscribers')) {
    return NextResponse.json({ error: 'forbidden: cannot send to subscribers' }, { status: 403 });
  }

  if (sendNow && !hasPermission(role, permissions, 'campaigns:send')) {
    return NextResponse.json({ error: 'forbidden: cannot send campaigns' }, { status: 403 });
  }

  const supabase = getServiceClient();

  try {
    // Generate HTML content if not provided
    let htmlContent = contentHtml;
    if (!htmlContent) {
      const template = generateCampaignEmail({
        subject,
        content,
      });
      htmlContent = template.html;
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        name,
        subject,
        content_html: htmlContent,
        content_text: content,
        recipient_type: recipientType,
        status: sendNow ? 'sending' : (scheduledAt ? 'scheduled' : 'draft'),
        scheduled_at: scheduledAt || null,
        sent_by: session.user?.id || null,
        sent_by_email: session.user?.email || null,
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      return NextResponse.json({ error: campaignError.message }, { status: 500 });
    }

    // If sendNow, queue the campaign for sending
    if (sendNow) {
      // Start sending in background (don't await to avoid timeout)
      sendCampaignAsync(campaign.id, recipientType, subject, htmlContent, content);

      return NextResponse.json({
        campaign,
        message: 'campaign created and sending started',
      }, { status: 201 });
    }

    return NextResponse.json({
      campaign,
      message: scheduledAt ? 'campaign scheduled' : 'campaign created as draft',
    }, { status: 201 });
  } catch (err: any) {
    console.error('Campaign creation error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// Async function to send campaign
async function sendCampaignAsync(
  campaignId: string,
  recipientType: string,
  subject: string,
  htmlContent: string,
  textContent: string
) {
  const supabase = getServiceClient();

  try {
    // Get recipients based on type
    let recipients: { id: string; email_encrypted: string; first_name?: string }[] = [];

    if (recipientType === 'staff' || recipientType === 'all') {
      const { data: staff } = await supabase
        .from('users')
        .select('id, email_encrypted, display_name');
      
      if (staff) {
        recipients.push(...staff.map(s => ({
          id: s.id,
          email_encrypted: s.email_encrypted || '',
          first_name: s.display_name?.split(' ')[0],
        })));
      }
    }

    if (recipientType === 'subscribers' || recipientType === 'all') {
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('id, email_encrypted, first_name')
        .eq('status', 'active');
      
      if (subscribers) {
        recipients.push(...subscribers.map(s => ({
          id: s.id,
          email_encrypted: s.email_encrypted || '',
          first_name: s.first_name || undefined,
        })));
      }
    }

    // Update campaign with started time
    await supabase
      .from('email_campaigns')
      .update({ started_at: new Date().toISOString() })
      .eq('id', campaignId);

    // Create recipient records
    const baseUrl = process.env.NEXTAUTH_URL || 'https://gboyinwa.com';
    
    for (const recipient of recipients) {
      const email = decryptEmail(recipient.email_encrypted);
      if (!email) continue;

      const unsubscribeToken = randomBytes(32).toString('hex');
      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${unsubscribeToken}`;

      await supabase.from('campaign_recipients').insert({
        campaign_id: campaignId,
        recipient_type: recipientType === 'staff' ? 'staff' : 'subscriber',
        [recipientType === 'staff' ? 'staff_user_id' : 'subscriber_id']: recipient.id,
        email_hash: require('@/lib/hash').hashEmail(email),
        email_encrypted: encryptPii(email),
        status: 'queued',
      });
    }

    // Check if Resend is configured
    if (!isResendConfigured()) {
      console.error('Resend not configured, campaign cannot send');
      await supabase
        .from('email_campaigns')
        .update({ 
          status: 'cancelled',
          metadata: { error: 'Resend not configured' }
        })
        .eq('id', campaignId);
      return;
    }

    // Send emails in batches
    const payloads: CampaignEmailPayload[] = recipients.map(r => {
      const email = decryptEmail(r.email_encrypted) || '';
      const template = generateCampaignEmail({
        subject,
        content: textContent,
        firstName: r.first_name,
      });

      return {
        to: email,
        subject,
        html: htmlContent,
        text: template.text,
        tags: [
          { name: 'campaign_id', value: campaignId },
          { name: 'type', value: 'campaign' },
        ],
      };
    });

    const results = await sendBulkEmails(payloads, (sent, total) => {
      console.log(`Campaign ${campaignId}: ${sent}/${total} sent`);
    });

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({
        status: results.failed > 0 ? 'sent' : 'sent',
        completed_at: new Date().toISOString(),
        metadata: {
          total: results.total,
          sent: results.sent,
          failed: results.failed,
          errors: results.errors.slice(0, 10), // Store first 10 errors
        }
      })
      .eq('id', campaignId);

    // Update recipient records with message IDs
    for (let i = 0; i < results.messageIds.length; i++) {
      if (results.messageIds[i]) {
        await supabase
          .from('campaign_recipients')
          .update({
            status: 'sent',
            external_message_id: results.messageIds[i],
            sent_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId)
          .limit(1);
      }
    }

  } catch (err: any) {
    console.error('Campaign send error:', err);
    await supabase
      .from('email_campaigns')
      .update({
        status: 'cancelled',
        metadata: { error: err.message }
      })
      .eq('id', campaignId);
  }
}

// Helper to decrypt email
function decryptEmail(encrypted: string): string | null {
  try {
    const { decryptPii } = require('@/lib/encrypt');
    return decryptPii(encrypted);
  } catch {
    return null;
  }
}
