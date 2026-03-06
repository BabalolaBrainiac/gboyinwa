# Communications & Subscriber System

This document describes the granular permission-based communications system for gboyinwa.

## Overview

The communications system includes:

1. **Blog Subscriptions** - Visitors can subscribe to blog updates
2. **Subscriber Management** - Admins can view, manage, and export subscribers
3. **Email Campaigns** - Send bulk emails to staff or subscribers
4. **Analytics Dashboard** - Track metrics and engagement
5. **Blog Notifications** - Auto-notify subscribers when posts are published

## Email Provider

We use **Resend** for subscriber emails and campaigns:

- **Free tier**: 3,000 emails/month
- **Paid tier**: $20/month for 50,000 emails
- **Sign up**: https://resend.com

ZeptoMail is still used for transactional emails (password resets, admin invites).

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Resend configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=newsletter@gboyinwa.com
RESEND_FROM_NAME=Gboyinwa
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Database Migration

Run the migration to create subscriber tables:

```bash
# Migration is at: supabase/migrations/20260306_subscribers_campaigns.sql
# Apply via Supabase Dashboard or CLI
```

### 3. Install Dependencies

```bash
npm install resend
```

### 4. Configure Resend Webhook (Optional)

For delivery tracking:

1. Go to Resend Dashboard → Webhooks
2. Add webhook URL: `https://gboyinwa.com/api/webhooks/resend`
3. Select events: email.sent, email.delivered, email.opened, email.clicked
4. Copy signing secret to `RESEND_WEBHOOK_SECRET`

## Permissions

Only **superadmin** can assign permissions. The granular permissions are:

### Subscriber Management
- `subscribers:view` - View subscriber list
- `subscribers:manage` - Add, edit, delete subscribers
- `subscribers:import` - Import subscribers from CSV
- `subscribers:export` - Export subscriber list

### Campaign Management
- `campaigns:view` - View email campaigns
- `campaigns:create` - Create new campaigns
- `campaigns:edit` - Edit draft campaigns
- `campaigns:delete` - Delete campaigns
- `campaigns:send` - Send campaigns (superadmin only)

### Communications
- `communications:view` - Access communications tab
- `communications:send_staff` - Send emails to staff
- `communications:send_subscribers` - Send emails to subscribers (superadmin only)

### Blog Subscriptions
- `subscriptions:view` - View subscription settings
- `subscriptions:manage` - Manage subscription settings
- `subscriptions:notify` - Send blog post notifications

### Metrics
- `metrics:view_dashboard` - View analytics dashboard
- `metrics:view_blog` - View blog metrics
- `metrics:view_subscribers` - View subscriber metrics
- `metrics:view_campaigns` - View campaign metrics
- `metrics:export` - Export analytics data

## API Endpoints

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscribe` | POST | Subscribe to blog |
| `/api/subscribe/confirm` | GET | Confirm subscription |
| `/api/unsubscribe` | GET/POST | Unsubscribe |

### Admin Endpoints

| Endpoint | Method | Permission Required |
|----------|--------|---------------------|
| `/api/admin/metrics` | GET | `metrics:view_dashboard` |
| `/api/admin/subscribers` | GET | `subscribers:view` |
| `/api/admin/subscribers` | POST | `subscribers:manage` |
| `/api/admin/subscribers/:id` | PATCH/DELETE | `subscribers:manage` |
| `/api/admin/campaigns` | GET | `campaigns:view` |
| `/api/admin/campaigns` | POST | `campaigns:create` |
| `/api/admin/campaigns/:id` | GET | `campaigns:view` |
| `/api/admin/campaigns/:id` | PATCH | `campaigns:edit` |
| `/api/admin/campaigns/:id` | DELETE | `campaigns:delete` |
| `/api/admin/campaigns/:id/send` | POST | `campaigns:send` |
| `/api/admin/communications` | POST | `communications:send_staff` |
| `/api/admin/posts/:id/notify` | POST | `subscriptions:notify` |

### Webhook Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/webhooks/resend` | Resend delivery events |

## UI Components

### Subscription Form

```tsx
import { SubscriptionForm } from '@/components/subscription-form';

// Card variant (default)
<SubscriptionForm />

// Inline variant
<SubscriptionForm variant="inline" />

// Footer variant (compact)
<SubscriptionForm variant="footer" />
```

### Admin Pages

- `/admin/communications` - Send emails to staff/subscribers
- `/admin/subscribers` - Manage subscribers
- `/admin/campaigns` - Manage email campaigns
- `/admin/analytics` - View metrics dashboard

## Database Schema

### subscribers
- `id` - UUID primary key
- `email_hash` - SHA-256 hash for lookup
- `email_encrypted` - Encrypted email address
- `first_name`, `last_name` - Optional names
- `status` - pending, active, unsubscribed, bounced
- `source` - Where subscription originated
- `confirmation_token` - Double opt-in token
- `unsubscribe_token` - Unsubscribe token
- Timestamps

### email_campaigns
- `id` - UUID primary key
- `name` - Internal campaign name
- `subject` - Email subject
- `content_html`, `content_text` - Email content
- `recipient_type` - staff, subscribers, all
- `status` - draft, scheduled, sending, sent, etc.
- `sent_by` - User who sent
- Timestamps

### campaign_recipients
- `id` - UUID primary key
- `campaign_id` - Reference to campaign
- `recipient_type` - subscriber or staff
- `subscriber_id` / `staff_user_id` - Polymorphic reference
- `status` - pending, queued, sent, delivered, bounced, etc.
- `opened_at`, `clicked_at` - Engagement tracking
- `external_message_id` - Resend message ID

### blog_post_notifications
- Tracks which posts have been sent to subscribers
- Links posts to campaigns

## Usage Examples

### Subscribe a User

```bash
curl -X POST https://gboyinwa.com/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "firstName": "John"}'
```

Response:
```json
{
  "message": "Please check your email to confirm your subscription.",
  "pending": true
}
```

### Create a Campaign

```bash
curl -X POST https://gboyinwa.com/api/admin/campaigns \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Monthly Newsletter",
    "subject": "March Updates from Gboyinwa",
    "content": "<p>Hello!</p><p>Here are our latest updates...</p>",
    "recipientType": "subscribers",
    "sendNow": false
  }'
```

### Send Blog Notification

```bash
curl -X POST https://gboyinwa.com/api/admin/posts/123/notify \
  -H "Cookie: next-auth.session-token=..."
```

## Best Practices

1. **Rate Limiting**: Campaigns send at 50 emails/batch with 100ms delay to respect Resend limits
2. **Double Opt-in**: Subscribers must confirm their email before receiving emails
3. **Unsubscribe**: All emails include unsubscribe links
4. **Encryption**: Subscriber emails are encrypted at rest
5. **Permissions**: Only superadmin can send to subscribers or send campaigns

## Troubleshooting

### Emails not sending
- Check `RESEND_API_KEY` is set
- Verify Resend domain is verified
- Check campaign_recipients table for failed statuses

### Webhooks not working
- Verify `RESEND_WEBHOOK_SECRET` matches
- Check webhook URL is accessible
- Review server logs

### Subscribers not receiving
- Check subscriber status is "active"
- Verify confirmation was completed
- Check campaign recipient status

## Migration from Existing System

If you have existing email subscribers:

1. Export from current provider
2. Use admin UI to import subscribers
3. Set status to "pending" to trigger confirmation emails
4. Or set status to "active" and set `confirmed_at` manually

## Future Enhancements

- [ ] CSV import/export for subscribers
- [ ] Email templates library
- [ ] A/B testing for campaigns
- [ ] Segmentation (tags, groups)
- [ ] Automation workflows
- [ ] SMS notifications (via Resend)
