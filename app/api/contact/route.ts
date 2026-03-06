import { NextRequest, NextResponse } from 'next/server';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:40px 20px;margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#053305 0%,#6C3B8B 100%);padding:32px 40px;">
        <h1 style="color:#F4C430;margin:0;font-size:22px;font-weight:700;">gbóyinwá</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">New message from the website</p>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">From</p>
        <p style="margin:0 0 4px;color:#053305;font-size:16px;font-weight:600;">${escapeHtml(name.trim())}</p>
        <a href="mailto:${escapeHtml(email)}" style="color:#F97316;font-size:14px;text-decoration:none;">${escapeHtml(email)}</a>
        <hr style="margin:20px 0;border:none;border-top:1px solid #f0f0f0;"/>
        <p style="margin:0 0 8px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <p style="margin:0;color:#333;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message.trim())}</p>
      </td></tr>
      <tr><td style="background:#f8f9fa;padding:20px 40px;text-align:center;">
        <p style="margin:0;color:#aaa;font-size:12px;">Gbóyinwá Media LTD · Lagos, Nigeria</p>
      </td></tr>
    </table>
  </td></tr></table>
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
      subject: `New message from ${name.trim()}`,
      htmlbody: htmlBody,
      textbody: `From: ${name.trim()} (${email})\n\n${message.trim()}`,
    }),
  });

  if (!res.ok) {
    console.error('ZeptoMail error:', res.status, await res.text());
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
