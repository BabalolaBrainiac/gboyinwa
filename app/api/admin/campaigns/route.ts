import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';
import { sendCampaignEmail, generateCampaignEmail, isResendConfigured } from '@/lib/resend';
import { decryptPii } from '@/lib/encrypt';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ── GET — list campaigns ───────────────────────────────────────────────────────
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!hasPermission(role, permissions, 'campaigns:view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const supabase = getServiceClient();

  let query = supabase
    .from('email_campaigns')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    console.error('[campaigns:GET] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    campaigns: data || [],
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  });
}

// ── POST — create campaign (and optionally send immediately) ──────────────────
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];
  const userId = (session?.user as { id?: string })?.id ?? null;

  if (!hasPermission(role, permissions, 'campaigns:create')) {
    return NextResponse.json({ error: 'forbidden: campaigns:create required' }, { status: 403 });
  }

  const body = await request.json();
  const { name, subject, content, recipientType, sendNow = false } = body;

  if (!name?.trim() || !subject?.trim() || !content?.trim() || !recipientType) {
    return NextResponse.json({ error: 'name, subject, content, and recipientType are required' }, { status: 400 });
  }
  if (!['staff', 'subscribers', 'all'].includes(recipientType)) {
    return NextResponse.json({ error: 'recipientType must be staff, subscribers, or all' }, { status: 400 });
  }
  if (sendNow && !hasPermission(role, permissions, 'campaigns:send')) {
    return NextResponse.json({ error: 'campaigns:send permission required to send immediately' }, { status: 403 });
  }

  const supabase = getServiceClient();

  // Build HTML
  const { html: htmlContent } = generateCampaignEmail({ subject, content });

  // Create campaign record
  const { data: campaign, error: insertErr } = await supabase
    .from('email_campaigns')
    .insert({
      name: name.trim(),
      subject: subject.trim(),
      content_html: htmlContent,
      content_text: content.trim(),
      recipient_type: recipientType,
      status: sendNow ? 'sending' : 'draft',
      sent_by: userId,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('[campaigns:POST] insert error:', insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Send immediately if requested (synchronous, with maxDuration = 300)
  if (sendNow) {
    await sendCampaignNow(campaign.id, recipientType, subject.trim(), htmlContent, content.trim());
  }

  return NextResponse.json({ campaign, message: sendNow ? 'Campaign created and sent' : 'Campaign created as draft' }, { status: 201 });
}

// ── Internal: resolve recipients and send emails ──────────────────────────────
export async function sendCampaignNow(
  campaignId: string,
  recipientType: string,
  subject: string,
  htmlContent: string,
  textContent: string
) {
  const supabase = getServiceClient();

  try {
    if (!isResendConfigured()) {
      await supabase.from('email_campaigns').update({ status: 'cancelled', metadata: { error: 'Resend not configured' } }).eq('id', campaignId);
      console.error('[campaign:send] Resend not configured');
      return { sent: 0, failed: 0, error: 'Resend not configured' };
    }

    // Collect recipients
    const recipients: { email: string; firstName?: string }[] = [];

    if (recipientType === 'staff' || recipientType === 'all') {
      const { data: staff } = await supabase.from('users').select('email_encrypted, display_name');
      for (const s of staff || []) {
        if (!s.email_encrypted) continue;
        const email = decryptPii(s.email_encrypted);
        if (email) recipients.push({ email, firstName: s.display_name?.split(' ')[0] });
      }
    }

    if (recipientType === 'subscribers' || recipientType === 'all') {
      const { data: subs } = await supabase.from('subscribers').select('email_encrypted, first_name').eq('status', 'active');
      for (const s of subs || []) {
        if (!s.email_encrypted) continue;
        const email = decryptPii(s.email_encrypted);
        if (email) recipients.push({ email, firstName: s.first_name || undefined });
      }
    }

    if (recipients.length === 0) {
      await supabase.from('email_campaigns').update({ status: 'sent', metadata: { sent: 0, note: 'no recipients found' }, completed_at: new Date().toISOString() }).eq('id', campaignId);
      return { sent: 0, failed: 0 };
    }

    await supabase.from('email_campaigns').update({ started_at: new Date().toISOString() }).eq('id', campaignId);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send in batches of 10
    const BATCH = 10;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      await Promise.all(batch.map(async (r) => {
        const { html } = generateCampaignEmail({ subject, content: textContent, firstName: r.firstName });
        const result = await sendCampaignEmail({ to: r.email, subject, html });
        if (result.success) sent++;
        else { failed++; errors.push(`${r.email}: ${result.error}`); }
      }));
    }

    await supabase.from('email_campaigns').update({
      status: 'sent',
      completed_at: new Date().toISOString(),
      total_recipients: recipients.length,
      sent_count: sent,
      metadata: { sent, failed, errors: errors.slice(0, 20) },
    }).eq('id', campaignId);

    return { sent, failed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await supabase.from('email_campaigns').update({ status: 'cancelled', metadata: { error: msg } }).eq('id', campaignId);
    console.error('[campaign:send] error:', msg);
    return { sent: 0, failed: 0, error: msg };
  }
}
