/**
 * ZeptoMail (Zoho) for transactional email. From: no-reply@gboyinwa.com.
 * Requires ZEPTOMAIL_API_KEY (Zoho-enczapikey value) in env.
 */

const ZEPTO_API = 'https://api.zeptomail.eu/v1.1/email';

function getBaseUrl(): string {
  // Use NEXTAUTH_URL if available
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  // Fallback for production
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Default for local development
  return 'http://localhost:3000';
}

export type SendEmailOptions = {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const key = process.env.ZEPTOMAIL_API_KEY;
  if (!key?.trim()) {
    console.error('ZEPTOMAIL_API_KEY not set');
    return false;
  }
  const auth = key.startsWith('Zoho-enczapikey ') ? key : `Zoho-enczapikey ${key}`;
  const res = await fetch(ZEPTO_API, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify({
      from: { address: 'no-reply@gboyinwa.com', name: 'Gbóyinwá Media' },
      to: [{ email_address: { address: options.to, name: options.toName ?? options.to } }],
      subject: options.subject,
      htmlbody: options.htmlBody,
      ...(options.textBody && { textbody: options.textBody }),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('zeptomail error:', res.status, err);
    return false;
  }
  return true;
}

export function adminInviteEmailPayload(loginUrl: string, tempPassword: string, toName?: string): SendEmailOptions {
  const name = toName ?? 'Admin';
  const logoUrl = `${getBaseUrl()}/images/logomark.png`;
  
  return {
    to: '',
    toName: name,
    subject: '🎉 Welcome to Gbóyinwá — Your Admin Access is Ready',
    htmlBody: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Access — Gbóyinwá Media</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color:#f8f9fa;">
  <!-- Outer Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #F4C430 0%, #ffffff 30%, #f8f9fa 100%); padding:40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 8px 32px rgba(5,51,5,0.12);">
          
          <!-- Header with Yellow Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #F4C430 0%, #F4C430 60%, #053305 100%); padding:48px 40px; text-align:center; position:relative;">
              <!-- Decorative pattern -->
              <div style="position:absolute; top:0; left:0; right:0; bottom:0; opacity:0.1; background-image:radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0); background-size:20px 20px;"></div>
              
              <!-- Logo -->
              <div style="position:relative; z-index:1;">
                <div style="background:#ffffff; border-radius:20px; padding:16px; display:inline-block; box-shadow:0 4px 16px rgba(0,0,0,0.15); margin-bottom:20px;">
                  <img src="${logoUrl}" alt="Gbóyinwá" style="width:64px; height:64px; display:block;" />
                </div>
                <h1 style="color:#053305; margin:0; font-size:32px; font-weight:800; letter-spacing:-0.5px; text-shadow:0 2px 4px rgba(244,196,48,0.3);">gbóyinwá</h1>
                <p style="color:#053305; margin:8px 0 0 0; font-size:14px; font-weight:500; opacity:0.8;">Media LTD — Documentary & Storytelling</p>
              </div>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <div style="text-align:center;">
                <div style="display:inline-block; background:#053305; color:#F4C430; padding:8px 20px; border-radius:50px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:20px;">
                  🎉 Admin Access Granted
                </div>
                <h2 style="color:#053305; margin:0 0 12px 0; font-size:28px; font-weight:700;">Welcome, ${escapeHtml(name)}!</h2>
                <p style="color:#4a5568; font-size:16px; line-height:1.7; margin:0;">
                  You've been granted admin access to the Gbóyinwá platform. You can now manage content, events, and help us share authentic Nigerian stories with the world.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Credentials Section -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf8; border-radius:16px; border:2px solid #053305;">
                <tr>
                  <td style="padding:28px;">
                    <h3 style="color:#053305; margin:0 0 20px 0; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">🔐 Your Login Credentials</h3>
                    
                    <!-- Login URL -->
                    <div style="background:#ffffff; border-radius:12px; padding:16px; margin-bottom:16px; border-left:4px solid #F4C430;">
                      <p style="margin:0 0 6px 0; color:#718096; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Login URL</p>
                      <a href="${escapeHtml(loginUrl)}" style="color:#053305; font-size:15px; font-weight:600; text-decoration:none; word-break:break-all;">${escapeHtml(loginUrl)}</a>
                    </div>
                    
                    <!-- Password -->
                    <div style="background: linear-gradient(135deg, #F4C430 0%, #FFD93D 100%); border-radius:12px; padding:20px; text-align:center;">
                      <p style="margin:0 0 8px 0; color:#053305; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Temporary Password</p>
                      <code style="color:#053305; font-size:22px; font-weight:800; font-family:'SF Mono', Monaco, monospace; letter-spacing:2px; background:rgba(255,255,255,0.4); padding:12px 24px; border-radius:8px; display:inline-block;">${escapeHtml(tempPassword)}</code>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Instructions -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48" valign="top" style="padding-right:16px;">
                    <div style="width:48px; height:48px; background:#F4C430; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px;">🔒</div>
                  </td>
                  <td valign="top">
                    <h4 style="color:#053305; margin:0 0 6px 0; font-size:16px; font-weight:700;">Security First</h4>
                    <p style="color:#718096; font-size:14px; line-height:1.6; margin:0;">Please change your password after your first login. This temporary password expires in 7 days.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(loginUrl)}" style="display:inline-block; background:linear-gradient(135deg, #053305 0%, #0a5c0a 100%); color:#F4C430; text-decoration:none; padding:18px 48px; border-radius:14px; font-weight:700; font-size:16px; box-shadow:0 4px 16px rgba(5,51,5,0.3); text-transform:uppercase; letter-spacing:0.5px;">
                      Access Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Help Section -->
          <tr>
            <td style="padding:0 40px 40px;">
              <div style="background:#f8f9fa; border-radius:12px; padding:20px; text-align:center;">
                <p style="margin:0; color:#4a5568; font-size:14px;">
                  Need help? Contact us at <a href="mailto:hello@gboyinwa.com" style="color:#053305; font-weight:600; text-decoration:none;">hello@gboyinwa.com</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:linear-gradient(135deg, #053305 0%, #0a5c0a 100%); padding:32px 40px; text-align:center;">
              <p style="margin:0 0 8px 0; color:#F4C430; font-size:18px; font-weight:700;">gbóyinwá</p>
              <p style="margin:0 0 16px 0; color:#ffffff; font-size:13px; opacity:0.8;">Documentary & Storytelling from Lagos</p>
              <p style="margin:0; color:#ffffff; font-size:12px; opacity:0.6;">
                © 2026 Gbóyinwá Media LTD · Lagos, Nigeria
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Note -->
        <p style="margin-top:24px; color:#718096; font-size:12px; text-align:center; max-width:500px;">
          This email contains sensitive information. Please do not forward or share it. 
          If you did not request this access, please contact us immediately.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textBody: `Welcome to Gbóyinwá Media, ${name}!

You've been granted admin access to our platform.

LOGIN DETAILS:
URL: ${loginUrl}
Temporary Password: ${tempPassword}

IMPORTANT:
- Please change your password after your first login
- This temporary password expires in 7 days
- Do not share these credentials with anyone

Need help? Contact us at hello@gboyinwa.com

Gbóyinwá Media LTD · Lagos, Nigeria
Documentary & Storytelling`,
  };
}

export function passwordResetEmailPayload(resetUrl: string, toName?: string): SendEmailOptions {
  const name = toName ?? 'User';
  const logoUrl = `${getBaseUrl()}/images/logomark.png`;
  
  return {
    to: '',
    toName: name,
    subject: '🔐 Reset Your Gbóyinwá Password',
    htmlBody: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset — Gbóyinwá Media</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color:#f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #F4C430 0%, #ffffff 25%, #f8f9fa 100%); padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 8px 32px rgba(5,51,5,0.12);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #053305 0%, #0a5c0a 100%); padding:40px; text-align:center;">
              <div style="background:#ffffff; border-radius:16px; padding:14px; display:inline-block; box-shadow:0 4px 16px rgba(0,0,0,0.2); margin-bottom:16px;">
                <img src="${logoUrl}" alt="Gbóyinwá" style="width:56px; height:56px; display:block;" />
              </div>
              <h1 style="color:#F4C430; margin:0; font-size:28px; font-weight:800;">gbóyinwá</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;">
                <div style="font-size:48px; margin-bottom:16px;">🔐</div>
                <h2 style="color:#053305; margin:0 0 12px 0; font-size:24px; font-weight:700;">Password Reset Request</h2>
                <p style="color:#4a5568; font-size:16px; line-height:1.7; margin:0 0 32px 0;">
                  Hi ${escapeHtml(name)}, we received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.
                </p>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(resetUrl)}" style="display:inline-block; background:linear-gradient(135deg, #F4C430 0%, #FFD93D 100%); color:#053305; text-decoration:none; padding:18px 48px; border-radius:14px; font-weight:700; font-size:16px; box-shadow:0 4px 16px rgba(244,196,48,0.4);">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- URL Fallback -->
              <div style="background:#f8f9fa; border-radius:12px; padding:16px; margin:24px 0;">
                <p style="margin:0 0 6px 0; color:#718096; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Or copy this link</p>
                <a href="${escapeHtml(resetUrl)}" style="color:#053305; font-size:13px; word-break:break-all; text-decoration:none;">${escapeHtml(resetUrl)}</a>
              </div>
              
              <p style="color:#a0aec0; font-size:14px; margin:24px 0 0 0; text-align:center;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa; padding:24px; text-align:center; border-top:1px solid #e2e8f0;">
              <p style="margin:0; color:#718096; font-size:12px;">
                Gbóyinwá Media LTD · Lagos, Nigeria · <a href="mailto:hello@gboyinwa.com" style="color:#053305; text-decoration:none;">hello@gboyinwa.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textBody: `Hi ${name},

We received a request to reset your Gbóyinwá password.

Reset your password: ${resetUrl}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

Gbóyinwá Media LTD · Lagos, Nigeria`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
