import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getServiceClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const newPassword = typeof body.password === 'string' ? body.password : '';
  if (!token || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'token and password (min 8 chars) required' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const supabase = getServiceClient();
  const { data: row } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!row) {
    return NextResponse.json({ error: 'invalid or expired token' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await supabase.from('users').update({ password_hash: passwordHash, updated_at: new Date().toISOString() }).eq('id', row.user_id);
  await supabase.from('password_reset_tokens').update({ used_at: new Date().toISOString() }).eq('id', row.id);

  return NextResponse.json({ message: 'password updated' });
}
