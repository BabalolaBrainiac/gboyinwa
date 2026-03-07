/**
 * Individual Campaign API
 * 
 * GET /api/admin/campaigns/:id - Get campaign details with stats
 * PATCH /api/admin/campaigns/:id - Update campaign (draft only)
 * DELETE /api/admin/campaigns/:id - Delete campaign
 * POST /api/admin/campaigns/:id/send - Send campaign
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';

interface Params {
  params: { id: string };
}

// Get campaign details
export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'campaigns:view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getServiceClient();

  try {
    // Get campaign with stats
    const { data: campaign, error: campaignError } = await supabase
      .from('v_campaign_stats')
      .select('*')
      .eq('id', params.id)
      .single();

    if (campaignError) {
      if (campaignError.code === 'PGRST116') {
        return NextResponse.json({ error: 'campaign not found' }, { status: 404 });
      }
      return NextResponse.json({ error: campaignError.message }, { status: 500 });
    }

    // Get recipient details if campaign is sent/sending
    let recipients = null;
    if (['sending', 'sent'].includes(campaign.status)) {
      const { data: recipientData } = await supabase
        .from('campaign_recipients')
        .select('id, status, opened_at, clicked_at, created_at')
        .eq('campaign_id', params.id)
        .order('created_at', { ascending: false });
      
      recipients = recipientData;
    }

    return NextResponse.json({
      campaign,
      recipients: recipients || [],
    });
  } catch (err: any) {
    console.error('Campaign fetch error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// Update campaign (only drafts)
export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'campaigns:edit')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, subject, contentHtml, contentText, scheduledAt } = body;

  const supabase = getServiceClient();

  try {
    // Check if campaign is still draft
    const { data: existing } = await supabase
      .from('email_campaigns')
      .select('status')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'campaign not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json({ 
        error: 'only draft campaigns can be edited' 
      }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (subject !== undefined) updates.subject = subject;
    if (body.recipient_type !== undefined) updates.recipient_type = body.recipient_type;
    if (contentHtml !== undefined) updates.content_html = contentHtml;
    if (contentText !== undefined) updates.content_text = contentText;
    if (scheduledAt !== undefined) {
      updates.scheduled_at = scheduledAt;
      updates.status = scheduledAt ? 'scheduled' : 'draft';
    }

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (err: any) {
    console.error('Campaign update error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// Delete campaign
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'campaigns:delete')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getServiceClient();

  try {
    // Check if campaign can be deleted
    const { data: existing } = await supabase
      .from('email_campaigns')
      .select('status')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'campaign not found' }, { status: 404 });
    }

    // Allow deletion of sending campaigns - they will be cancelled first
    if (existing.status === 'sending') {
      // Update status to cancelled first
      await supabase
        .from('email_campaigns')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', params.id);
    }

    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Campaign delete error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
