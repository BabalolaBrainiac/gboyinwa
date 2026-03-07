import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';
import { sendCampaignNow } from '@/app/api/admin/campaigns/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!hasPermission(role, permissions, 'campaigns:send')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getServiceClient();
  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .select('id, status, recipient_type, subject, content_html, content_text')
    .eq('id', params.id)
    .single();

  if (error || !campaign) return NextResponse.json({ error: 'campaign not found' }, { status: 404 });
  if (campaign.status !== 'draft') return NextResponse.json({ error: 'only draft campaigns can be sent' }, { status: 400 });

  // Mark as sending
  await supabase.from('email_campaigns').update({ status: 'sending', started_at: new Date().toISOString() }).eq('id', params.id);

  // Send synchronously (maxDuration = 300 gives us 5 minutes)
  const result = await sendCampaignNow(
    campaign.id,
    campaign.recipient_type,
    campaign.subject,
    campaign.content_html,
    campaign.content_text
  );

  return NextResponse.json({ message: 'Campaign sent', ...result });
}
