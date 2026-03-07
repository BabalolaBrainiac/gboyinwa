import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { shareDocument } from '@/lib/documents';
import { getServiceClient } from '@/lib/supabase';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const RESEND_FROM = process.env.RESEND_FROM_EMAIL || 'no-reply@gboyinwa.com';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'Gboyinwa';
const BASE_URL = process.env.NEXTAUTH_URL || 'https://gboyinwa.com';

function buildShareEmail(opts: {
  docTitle: string;
  sharerName: string;
  shareUrl: string;
  message?: string;
  expiresAt: string | null;
}) {
  const expiry = opts.expiresAt
    ? `<p style="color:#666;font-size:13px;margin-top:8px;">This link expires on ${new Date(opts.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>`
    : '';
  const personalMessage = opts.message
    ? `<blockquote style="border-left:3px solid #F4C430;margin:16px 0;padding:10px 16px;background:#fffbeb;color:#444;border-radius:4px;">${opts.message}</blockquote>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#053305;padding:28px 32px;text-align:center;">
            <p style="color:#F4C430;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.5px;">Gboyinwa</p>
            <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:6px 0 0;text-transform:uppercase;letter-spacing:1px;">Document Share</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="color:#111;font-size:16px;margin:0 0 8px;"><strong>${opts.sharerName}</strong> shared a document with you:</p>
            <p style="color:#333;font-size:22px;font-weight:700;margin:8px 0 20px;border-left:4px solid #F4C430;padding-left:12px;">${opts.docTitle}</p>
            ${personalMessage}
            <a href="${opts.shareUrl}" style="display:inline-block;margin:20px 0;padding:14px 32px;background:#F4C430;color:#0D0D0D;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">View Document →</a>
            ${expiry}
            <hr style="border:none;border-top:1px solid #eee;margin:28px 0 20px;">
            <p style="color:#999;font-size:12px;margin:0;line-height:1.6;">
              If the button doesn't work, copy this link:<br>
              <a href="${opts.shareUrl}" style="color:#053305;word-break:break-all;">${opts.shareUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#bbb;font-size:11px;margin:0;">Gboyinwa · Documentary Films &amp; Media</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role?: string }).role || '';
    const permissions = (session.user as { permissions?: string[] }).permissions || [];

    if (!hasPermission(role, permissions, 'documents:share')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { emails, message, expiresInDays = 7 } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'At least one email address is required' }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id || '';
    const sharerName = (session.user as { displayName?: string }).displayName || 'Someone';

    // Fetch document details for the email
    const supabase = getServiceClient();
    const { data: doc } = await supabase
      .from('documents')
      .select('title, file_name')
      .eq('id', id)
      .single();

    const docTitle = doc?.title || 'a document';

    // Resend client
    const resendKey = process.env.RESEND_API_KEY;
    const resend = resendKey ? new Resend(resendKey) : null;

    const results = await Promise.all(
      emails.map(async (email: string) => {
        try {
          const share = await shareDocument(id, userId, email, message, expiresInDays);
          if (!share) return { email, success: false, error: 'Failed to create share record' };

          const shareUrl = `${BASE_URL}/share/${share.access_token}`;

          // Send notification email
          if (resend) {
            const html = buildShareEmail({
              docTitle,
              sharerName,
              shareUrl,
              message,
              expiresAt: share.expires_at,
            });

            const { error: emailErr } = await resend.emails.send({
              from: `${RESEND_FROM_NAME} <${RESEND_FROM}>`,
              to: email,
              subject: `${sharerName} shared "${docTitle}" with you`,
              html,
            });

            if (emailErr) {
              console.warn(`[share] email to ${email} failed:`, emailErr);
              return { email, success: true, emailSent: false, shareUrl };
            }
          } else {
            console.warn('[share] RESEND_API_KEY not set — share record created but email not sent');
          }

          return { email, success: true, emailSent: !!resend, shareUrl };
        } catch (err) {
          return { email, success: false, error: (err as Error).message };
        }
      })
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const emailsSent = results.filter(r => r.success && (r as { emailSent?: boolean }).emailSent).length;

    return NextResponse.json({
      success: true,
      shared: successful.length,
      emailsSent,
      emailsSkipped: successful.length - emailsSent,
      failed: failed.map(f => ({ email: f.email, error: (f as { error?: string }).error })),
      missingResend: !resend,
    });
  } catch (err) {
    console.error('[share] error:', err);
    return NextResponse.json({ error: 'Failed to share document' }, { status: 500 });
  }
}
