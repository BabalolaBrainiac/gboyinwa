/**
 * Resend API Integration for Subscriber Emails and Campaigns
 * 
 * Features:
 * - Send bulk campaigns to subscribers
 * - Send staff communications
 * - Handle webhooks for delivery tracking
 * - Manage contact lists
 * 
 * Free tier: 3,000 emails/month
 * Paid: $20/month for 50,000 emails
 * 
 * @see https://resend.com/docs
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'newsletter@gboyinwa.com';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'Gboyinwa';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

// =============================================================================
// TYPES
// =============================================================================

export interface CampaignEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface BulkEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface CampaignSendResult {
  total: number;
  sent: number;
  failed: number;
  errors: { email: string; error: string }[];
  messageIds: string[];
}

// =============================================================================
// SINGLE EMAIL
// =============================================================================

export async function sendCampaignEmail(payload: CampaignEmailPayload): Promise<BulkEmailResult> {
  try {
    const client = getResendClient();
    
    const { data, error } = await client.emails.send({
      from: `${payload.fromName || RESEND_FROM_NAME} <${payload.from || RESEND_FROM_EMAIL}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
      tags: payload.tags,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('Resend send error:', err);
    return { success: false, error: err.message };
  }
}

// =============================================================================
// BULK EMAILS (with rate limiting)
// =============================================================================

// Resend rate limits: 100 emails/second for free, 500/second for paid
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 100;

export async function sendBulkEmails(
  payloads: CampaignEmailPayload[],
  onProgress?: (sent: number, total: number) => void
): Promise<CampaignSendResult> {
  const result: CampaignSendResult = {
    total: payloads.length,
    sent: 0,
    failed: 0,
    errors: [],
    messageIds: [],
  };

  // Process in batches to respect rate limits
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const batch = payloads.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (payload) => {
      const res = await sendCampaignEmail(payload);
      if (res.success) {
        result.sent++;
        if (res.messageId) result.messageIds.push(res.messageId);
      } else {
        result.failed++;
        result.errors.push({ 
          email: Array.isArray(payload.to) ? payload.to[0] : payload.to, 
          error: res.error || 'Unknown error' 
        });
      }
    });

    await Promise.all(batchPromises);
    
    if (onProgress) {
      onProgress(result.sent + result.failed, payloads.length);
    }

    // Delay between batches if not the last batch
    if (i + BATCH_SIZE < payloads.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return result;
}

// =============================================================================
// TEMPLATES
// =============================================================================

export function generateBlogNotificationEmail(params: {
  postTitle: string;
  postExcerpt: string;
  postUrl: string;
  postImage?: string;
  unsubscribeUrl: string;
  firstName?: string;
}): { html: string; text: string } {
  const greeting = params.firstName ? `Hi ${params.firstName},` : 'Hi there,';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Blog Post</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .content { background: #fff; border-radius: 8px; }
    .post-image { width: 100%; border-radius: 8px 8px 0 0; }
    .post-title { font-size: 24px; margin: 20px 0; color: #1a1a1a; }
    .post-excerpt { color: #666; margin-bottom: 20px; }
    .cta-button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
    .footer a { color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Gboyinwa</div>
  </div>
  <div class="content">
    ${params.postImage ? `<img src="${params.postImage}" alt="" class="post-image">` : ''}
    <p>${greeting}</p>
    <p>We just published a new blog post we think you'll enjoy:</p>
    <h1 class="post-title">${params.postTitle}</h1>
    <p class="post-excerpt">${params.postExcerpt}</p>
    <a href="${params.postUrl}" class="cta-button">Read Full Article</a>
  </div>
  <div class="footer">
    <p>You're receiving this because you subscribed to our blog.</p>
    <p><a href="${params.unsubscribeUrl}">Unsubscribe</a> | <a href="https://gboyinwa.com">Visit Website</a></p>
  </div>
</body>
</html>`;

  const text = `${greeting}

We just published a new blog post we think you'll enjoy:

${params.postTitle}

${params.postExcerpt}

Read the full article: ${params.postUrl}

---
You're receiving this because you subscribed to our blog.
Unsubscribe: ${params.unsubscribeUrl}
Visit: https://gboyinwa.com`;

  return { html, text };
}

export function generateCampaignEmail(params: {
  subject: string;
  content: string;
  unsubscribeUrl?: string;
  firstName?: string;
  isStaff?: boolean;
}): { html: string; text: string } {
  const greeting = params.firstName ? `Hi ${params.firstName},` : 'Hi there,';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #000; }
    .logo { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .content { background: #fff; }
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
    ${params.content}
  </div>
  ${params.unsubscribeUrl ? `
  <div class="footer">
    <p>You're receiving this because you ${params.isStaff ? 'are a team member' : 'subscribed to our updates'}.</p>
    ${params.unsubscribeUrl ? `<p><a href="${params.unsubscribeUrl}">Unsubscribe</a> | <a href="https://gboyinwa.com">Visit Website</a></p>` : ''}
  </div>
  ` : ''}
</body>
</html>`;

  const text = `${greeting}

${params.content.replace(/<[^>]*>/g, '')}

---
${params.unsubscribeUrl ? `You're receiving this because you ${params.isStaff ? 'are a team member' : 'subscribed to our updates'}.
Unsubscribe: ${params.unsubscribeUrl}` : ''}`;

  return { html, text };
}

export function generateStaffEmail(params: {
  subject: string;
  content: string;
  firstName?: string;
}): { html: string; text: string } {
  return generateCampaignEmail({
    subject: params.subject,
    content: params.content,
    firstName: params.firstName,
    isStaff: true,
  });
}

export function generateSubscriptionConfirmationEmail(params: {
  confirmationUrl: string;
  firstName?: string;
}): { html: string; text: string } {
  const greeting = params.firstName ? `Hi ${params.firstName},` : 'Hi there,';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Subscription</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .content { background: #fff; border-radius: 8px; text-align: center; }
    .cta-button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Gboyinwa</div>
  </div>
  <div class="content">
    <p>${greeting}</p>
    <p>Thanks for subscribing to our blog! Please confirm your email address to start receiving updates.</p>
    <a href="${params.confirmationUrl}" class="cta-button">Confirm Subscription</a>
    <p style="font-size: 12px; color: #666;">Or copy and paste this link: ${params.confirmationUrl}</p>
  </div>
  <div class="footer">
    <p>If you didn't request this subscription, you can safely ignore this email.</p>
  </div>
</body>
</html>`;

  const text = `${greeting}

Thanks for subscribing to our blog! Please confirm your email address to start receiving updates.

Confirm your subscription: ${params.confirmationUrl}

If you didn't request this subscription, you can safely ignore this email.

---
Gboyinwa`;

  return { html, text };
}

export function generateWelcomeEmail(params: {
  firstName?: string;
  blogUrl: string;
}): { html: string; text: string } {
  const greeting = params.firstName ? `Hi ${params.firstName},` : 'Hi there,';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .content { background: #fff; border-radius: 8px; }
    .cta-button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Gboyinwa</div>
  </div>
  <div class="content">
    <p>${greeting}</p>
    <p>Welcome to our community! You're now subscribed to receive the latest updates from our blog.</p>
    <p>You'll be the first to know about:</p>
    <ul style="text-align: left; display: inline-block;">
      <li>New blog posts and articles</li>
      <li>Foundation updates and news</li>
      <li>Grant opportunities and deadlines</li>
      <li>Success stories from our community</li>
    </ul>
    <p><a href="${params.blogUrl}" class="cta-button">Visit Our Blog</a></p>
  </div>
  <div class="footer">
    <p>Thanks for being part of our community!</p>
  </div>
</body>
</html>`;

  const text = `${greeting}

Welcome to our community! You're now subscribed to receive the latest updates from our blog.

You'll be the first to know about:
- New blog posts and articles
- Foundation updates and news
- Grant opportunities and deadlines
- Success stories from our community

Visit our blog: ${params.blogUrl}

Thanks for being part of our community!

---
Gboyinwa`;

  return { html, text };
}

// =============================================================================
// WEBHOOK HANDLING
// =============================================================================

export interface ResendWebhookPayload {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained';
  data: {
    id: string; // Resend message ID
    object: 'email';
    created_at: number;
    to: string[];
    from: string;
    subject: string;
    tags?: { name: string; value: string }[];
    click?: {
      ipAddress: string;
      link: string;
      timestamp: number;
      userAgent: string;
    };
    open?: {
      ipAddress: string;
      timestamp: number;
      userAgent: string;
    };
    bounce?: {
      reason: string;
      timestamp: number;
    };
  };
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // Resend uses simple signature verification
  // In production, implement proper HMAC verification
  // @see https://resend.com/docs/dashboard/webhooks#verifying-webhooks
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// =============================================================================
// VALIDATION
// =============================================================================

export function isResendConfigured(): boolean {
  return !!RESEND_API_KEY;
}

export function validateConfig(): { valid: boolean; error?: string } {
  if (!RESEND_API_KEY) {
    return { valid: false, error: 'RESEND_API_KEY not configured' };
  }
  return { valid: true };
}
