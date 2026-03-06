import { NextRequest, NextResponse } from 'next/server';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, message } = body as Record<string, string>;

  if (
    typeof name !== 'string' || name.trim().length < 1 || name.length > 100 ||
    typeof email !== 'string' || !email.includes('@') ||
    typeof message !== 'string' || message.trim().length < 1 || message.length > 2000
  ) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const key = process.env.ZEPTOMAIL_API_KEY;
  if (!key?.trim()) {
    console.error('ZEPTOMAIL_API_KEY not set');
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
  }

  const auth = key.startsWith('Zoho-enczapikey ') ? key : `Zoho-enczapikey ${key}`;
  const logoUrl = `${getBaseUrl()}/images/logomark.png`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Message — Gbóyinwá</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif; background:linear-gradient(180deg,#F4C430 0%,#f8f9fa 30%); padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(5,51,5,0.12);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#053305 0%,#0a5c0a 100%);padding:32px 40px;text-align:center;">
              <div style="background:#ffffff;border-radius:16px;padding:14px;display:inline-block;box-shadow:0 4px 16px rgba(0,0,0,0.2);margin-bottom:12px;">
                <img src="${logoUrl}" alt="Gbóyinwá" style="width:48px;height:48px;display:block;"/>
              </div>
              <h1 style="color:#F4C430;margin:0;font-size:24px;font-weight:800;">gbóyinwá</h1>
              <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">New message from the website</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <!-- Sender Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf8;border-radius:16px;border:2px solid #053305;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" valign="top" style="padding-right:16px;">
                          <div style="width:40px;height:40px;background:linear-gradient(135deg,#F4C430 0%,#FFD93D 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>
                        </td>
                        <td valign="top">
                          <p style="margin:0 0 4px;color:#718096;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">From</p>
                          <p style="margin:0 0 4px;color:#053305;font-size:18px;font-weight:700;">${escapeHtml(name.trim())}</p>
                          <a href="mailto:${escapeHtml(email)}" style="color:#F97316;font-size:14px;text-decoration:none;font-weight:500;">${escapeHtml(email)}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <div style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:24px;">
                <p style="margin:0 0 12px;color:#053305;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">💬 Message</p>
                <p style="margin:0;color:#4a5568;font-size:15px;line-height:1.8;white-space:pre-wrap;">${escapeHtml(message.trim())}</p>
              </div>
              
              <!-- Reply CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${escapeHtml(email)}" style="display:inline-block;background:linear-gradient(135deg,#F4C430 0%,#FFD93D 100%);color:#053305;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(244,196,48,0.3);">
                      Reply to ${escapeHtml(name.trim())} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#718096;font-size:13px;">
                Gbóyinwá Media LTD · Lagos, Nigeria · <a href="mailto:hello@gboyinwa.com" style="color:#053305;text-decoration:none;font-weight:500;">hello@gboyinwa.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.zeptomail.eu/v1.1/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify({
      from: { address: 'no-reply@gboyinwa.com', name: 'Gbóyinwá Website' },
      to: [{ email_address: { address: 'hello@gboyinwa.com', name: 'Gbóyinwá' } }],
      reply_to: [{ address: email, name: name.trim() }],
      subject: `📬 New message from ${name.trim()} — Gbóyinwá Website`,
      htmlbody: htmlBody,
      textbody: `New message from ${name.trim()} (${email})\n\n${message.trim()}\n\n---\nGbóyinwá Media LTD · Lagos, Nigeria`,
    }),
  });

  if (!res.ok) {
    console.error('ZeptoMail error:', res.status, await res.text());
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
