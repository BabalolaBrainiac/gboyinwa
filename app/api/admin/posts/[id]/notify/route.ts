/**
 * Blog Post Notification API
 * 
 * POST /api/admin/posts/:id/notify - Send notification to subscribers
 * 
 * Required permission: subscriptions:notify
 * 
 * Sends an email to all active subscribers when a new blog post is published.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';
import { sendBulkEmails, generateBlogNotificationEmail, type CampaignEmailPayload } from '@/lib/resend';
import { encryptPii } from '@/lib/encrypt';
import { randomBytes } from 'crypto';

interface Params {
  params: { id: string };
}

export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'subscriptions:notify')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getServiceClient();

  try {
    // Get the blog post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title, excerpt, slug, featured_image, published, published_at')
      .eq('id', params.id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'post not found' }, { status: 404 });
    }

    if (!post.published) {
      return NextResponse.json({ error: 'cannot notify for unpublished post' }, { status: 400 });
    }

    // Check if already notified
    const { data: existingNotification } = await supabase
      .from('blog_post_notifications')
      .select('id')
      .eq('post_id', params.id)
      .single();

    if (existingNotification) {
      return NextResponse.json({ 
        error: 'notification already sent for this post',
        notificationId: existingNotification.id
      }, { status: 409 });
    }

    // Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('id, email_encrypted, first_name, unsubscribe_token')
      .eq('status', 'active');

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'no active subscribers' }, { status: 400 });
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        name: `Blog: ${post.title}`,
        subject: `New Blog Post: ${post.title}`,
        content_html: '', // Will be generated per-recipient
        content_text: post.excerpt || '',
        recipient_type: 'subscribers',
        status: 'sending',
        sent_by: session.user?.id || null,
        sent_by_email: session.user?.email || null,
      })
      .select()
      .single();

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 500 });
    }

    // Create notification record
    await supabase.from('blog_post_notifications').insert({
      post_id: params.id,
      campaign_id: campaign.id,
      notification_sent: true,
      notification_sent_at: new Date().toISOString(),
      sent_by: session.user?.id || null,
      subscriber_count: subscribers.length,
    });

    // Send emails asynchronously (don't wait)
    sendBlogNotifications(campaign.id, post, subscribers);

    return NextResponse.json({
      message: 'notification sending started',
      campaignId: campaign.id,
      subscriberCount: subscribers.length,
    });
  } catch (err: any) {
    console.error('Blog notification error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// Async function to send blog notifications
async function sendBlogNotifications(
  campaignId: string,
  post: { id: string; title: string; excerpt?: string; slug: string; featured_image?: string },
  subscribers: { id: string; email_encrypted?: string; first_name?: string; unsubscribe_token?: string }[]
) {
  const supabase = getServiceClient();
  const baseUrl = process.env.NEXTAUTH_URL || 'https://gboyinwa.com';

  try {
    // Create recipient records
    for (const subscriber of subscribers) {
      const email = decryptEmail(subscriber.email_encrypted);
      if (!email) continue;

      await supabase.from('campaign_recipients').insert({
        campaign_id: campaignId,
        recipient_type: 'subscriber',
        subscriber_id: subscriber.id,
        email_hash: require('@/lib/hash').hashEmail(email),
        email_encrypted: encryptPii(email),
        status: 'queued',
      });
    }

    // Prepare email payloads
    const payloads: CampaignEmailPayload[] = [];

    for (const subscriber of subscribers) {
      const email = decryptEmail(subscriber.email_encrypted);
      if (!email) continue;

      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${subscriber.unsubscribe_token || ''}`;
      const postUrl = `${baseUrl}/blog/${post.slug}`;

      const { html, text } = generateBlogNotificationEmail({
        postTitle: post.title,
        postExcerpt: post.excerpt || '',
        postUrl,
        postImage: post.featured_image,
        unsubscribeUrl,
        firstName: subscriber.first_name,
      });

      payloads.push({
        to: email,
        subject: `New Blog Post: ${post.title}`,
        html,
        text,
        tags: [
          { name: 'campaign_id', value: campaignId },
          { name: 'post_id', value: post.id },
          { name: 'type', value: 'blog_notification' },
        ],
      });
    }

    // Send emails in batches
    const results = await sendBulkEmails(payloads, (sent, total) => {
      console.log(`Blog notification ${campaignId}: ${sent}/${total} sent`);
    });

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        completed_at: new Date().toISOString(),
        metadata: {
          total: results.total,
          sent: results.sent,
          failed: results.failed,
        }
      })
      .eq('id', campaignId);

    // Update notification record with metrics
    await supabase
      .from('blog_post_notifications')
      .update({
        delivered_count: results.sent,
      })
      .eq('campaign_id', campaignId);

    // Update recipient records
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
    console.error('Blog notification send error:', err);
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
function decryptEmail(encrypted: string | undefined): string | null {
  if (!encrypted) return null;
  try {
    const { decryptPii } = require('@/lib/encrypt');
    return decryptPii(encrypted);
  } catch {
    return null;
  }
}
