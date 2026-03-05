import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { randomBytes } from 'crypto';
import { getServiceClient } from '@/lib/supabase';
import { hashEmail } from '@/lib/hash';
import { sendEmail, passwordResetEmailPayload } from '@/lib/zeptomail';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const supabase = getServiceClient();
  const emailHash = hashEmail(email);
  const { data: user } = await supabase.from('users').select('id').eq('email_hash', emailHash).single();
  if (!user) {
    return NextResponse.json({ message: 'if that email exists, we sent a reset link' });
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
  const payload = passwordResetEmailPayload(resetUrl);
  payload.to = email;
  await sendEmail(payload);

  return NextResponse.json({ message: 'if that email exists, we sent a reset link' });
}
