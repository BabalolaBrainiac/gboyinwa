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
      from: { address: 'no-reply@gboyinwa.com', name: 'Gbóyinwá Engineering' },
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
  const logoUrl = `${getBaseUrl()}/images/logo.png`;
  
  return {
    to: '',
    toName: name,
    subject: 'Your Gbóyinwá Admin Access',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Access - Gbóyinwá</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="background:linear-gradient(135deg, #053305 0%, #6C3B8B 100%); padding:40px; text-align:center;">
              <img src="${logoUrl}" alt="Gbóyinwá" style="width:80px; height:80px; border-radius:16px; margin-bottom:16px;" />
              <h1 style="color:#F4C430; margin:0; font-size:28px; font-weight:bold;">gbóyinwá</h1>
              <p style="color:#ffffff; margin:8px 0 0 0; opacity:0.8; font-size:14px;">Media LTD</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#053305; margin:0 0 16px 0; font-size:24px;">Welcome, ${escapeHtml(name)}</h2>
              <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 24px 0;">
                You have been granted admin access to the Gbóyinwá platform. Below are your login credentials. Please change your password after your first login for security purposes.
              </p>
              
              <!-- Login URL -->
              <div style="background-color:#f8f9fa; border-radius:12px; padding:20px; margin-bottom:24px; border-left:4px solid #F4C430;">
                <p style="margin:0 0 8px 0; color:#666666; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Login URL</p>
                <a href="${escapeHtml(loginUrl)}" style="color:#053305; font-size:16px; font-weight:600; text-decoration:none; word-break:break-all;">${escapeHtml(loginUrl)}</a>
              </div>
              
              <!-- Password -->
              <div style="background-color:#fff3cd; border-radius:12px; padding:20px; margin-bottom:24px; border:2px dashed #F4C430;">
                <p style="margin:0 0 8px 0; color:#856404; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Temporary Password</p>
                <code style="color:#053305; font-size:20px; font-weight:bold; font-family:monospace; letter-spacing:1px;">${escapeHtml(tempPassword)}</code>
              </div>
              
              <!-- Security Notice -->
              <div style="background-color:#d4edda; border-radius:8px; padding:16px; margin-bottom:24px;">
                <p style="margin:0; color:#155724; font-size:14px; line-height:1.5;">
                  <strong>Security Tip:</strong> This email contains sensitive information. Please do not forward or share it with anyone. If you did not request this access, please contact us immediately.
                </p>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(loginUrl)}" style="display:inline-block; background:linear-gradient(135deg, #053305 0%, #6C3B8B 100%); color:#ffffff; text-decoration:none; padding:16px 40px; border-radius:12px; font-weight:600; font-size:16px;">
                      Login to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa; padding:24px 40px; text-align:center; border-top:1px solid #e9ecef;">
              <p style="margin:0 0 8px 0; color:#666666; font-size:14px;">
                Need help? Contact us at <a href="mailto:engineering@gboyinwa.com" style="color:#053305; text-decoration:none;">engineering@gboyinwa.com</a>
              </p>
              <p style="margin:0; color:#999999; font-size:12px;">
                Gbóyinwá Media LTD · Lagos, Nigeria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textBody: `Welcome to Gbóyinwá, ${name}!\n\nYou have been granted admin access to the Gbóyinwá platform.\n\nLogin URL: ${loginUrl}\nTemporary Password: ${tempPassword}\n\nPlease change your password after your first login for security purposes.\n\nIf you did not request this access, please contact us immediately at engineering@gboyinwa.com\n\nGbóyinwá Media LTD · Lagos, Nigeria`,
  };
}

export function passwordResetEmailPayload(resetUrl: string, toName?: string): SendEmailOptions {
  const name = toName ?? 'User';
  const logoUrl = `${getBaseUrl()}/images/logo.png`;
  
  return {
    to: '',
    toName: name,
    subject: 'Reset Your Gbóyinwá Password',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Gbóyinwá</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg, #053305 0%, #6C3B8B 100%); padding:40px; text-align:center;">
              <img src="${logoUrl}" alt="Gbóyinwá" style="width:80px; height:80px; border-radius:16px; margin-bottom:16px;" />
              <h1 style="color:#F4C430; margin:0; font-size:28px; font-weight:bold;">gbóyinwá</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#053305; margin:0 0 16px 0; font-size:24px;">Password Reset Request</h2>
              <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 24px 0;">
                Hi ${escapeHtml(name)}, we received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(resetUrl)}" style="display:inline-block; background:linear-gradient(135deg, #053305 0%, #6C3B8B 100%); color:#ffffff; text-decoration:none; padding:16px 40px; border-radius:12px; font-weight:600; font-size:16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#666666; font-size:14px; margin:24px 0 0 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8f9fa; padding:24px 40px; text-align:center; border-top:1px solid #e9ecef;">
              <p style="margin:0; color:#999999; font-size:12px;">
                Gbóyinwá Media LTD · Lagos, Nigeria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textBody: `Hi ${name},\n\nWe received a request to reset your password.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.\n\nGbóyinwá Media LTD`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
