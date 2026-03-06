/**
 * Send Campaign API
 * 
 * POST /api/admin/campaigns/:id/send - Send a draft campaign
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';

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

  if (!hasPermission(role, permissions, 'campaigns:send')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getServiceClient();

  try {
    // Get campaign
    const { data: campaign, error: fetchError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'draft') {
      return NextResponse.json({ 
        error: 'only draft campaigns can be sent' 
      }, { status: 400 });
    }

    // Update status to sending
    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
        sent_by: session.user?.id || null,
        sent_by_email: session.user?.email || null,
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Trigger the actual send via the parent route's logic
    // In production, this would queue to a background job
    // For now, return success and let the client poll for status
    return NextResponse.json({
      message: 'campaign sending started',
      campaignId: params.id,
    });
  } catch (err: any) {
    console.error('Campaign send error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
