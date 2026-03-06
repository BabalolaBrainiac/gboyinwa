/**
 * Communications API - Quick staff email sending
 * 
 * POST /api/admin/communications - Send email to staff
 * 
 * Required permission: communications:send_staff
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, canSendStaffEmails, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';
import { sendCampaignEmail, generateStaffEmail } from '@/lib/resend';
import { decryptPii } from '@/lib/encrypt';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!canSendStaffEmails(role, permissions)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { subject, content, recipientIds } = body;

  if (!subject || !content) {
    return NextResponse.json({ 
      error: 'subject and content are required' 
    }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    // Get staff recipients
    let query = supabase.from('users').select('id, email_encrypted, display_name');
    
    if (recipientIds && recipientIds.length > 0) {
      query = query.in('id', recipientIds);
    }

    const { data: staff, error: staffError } = await query;

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    if (!staff || staff.length === 0) {
      return NextResponse.json({ error: 'no recipients found' }, { status: 400 });
    }

    // Generate email content
    const { html, text } = generateStaffEmail({ subject, content });

    // Send emails
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const user of staff) {
      const email = user.email_encrypted ? decryptPii(user.email_encrypted) : null;
      if (!email) {
        results.failed++;
        results.errors.push(`Could not decrypt email for ${user.display_name || user.id}`);
        continue;
      }

      const result = await sendCampaignEmail({
        to: email,
        subject,
        html,
        text,
        tags: [
          { name: 'type', value: 'staff_communication' },
          { name: 'sent_by', value: session.user?.id || 'unknown' },
        ],
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${email}: ${result.error}`);
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (err: any) {
    console.error('Communication send error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
