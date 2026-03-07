import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminEmail } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';
import { hashEmail } from '@/lib/hash';
import { encryptPii } from '@/lib/encrypt';
import { sendEmail, adminInviteEmailPayload } from '@/lib/zeptomail';
import { hashPassword } from '@/lib/password';
import { randomBytes } from 'crypto';

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const buf = randomBytes(20);
  let s = '';
  for (let i = 0; i < 20; i++) s += chars[buf[i]! % chars.length];
  return s;
}

function deriveDisplayName(email: string): string {
  const part = email.split('@')[0] ?? email;
  const cleaned = part.replace(/[._0-9]+/g, ' ').trim() || part;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'superadmin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const supabase = getServiceClient();
  const { data: users, error } = await supabase
    .from('users')
    .select('id, role, created_at, display_name, avatar_url')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: perms } = await supabase.from('user_permissions').select('user_id, permission');
  const permsByUser = (perms ?? []).reduce<Record<string, string[]>>((acc, p) => {
    if (!acc[p.user_id]) acc[p.user_id] = [];
    acc[p.user_id].push(p.permission);
    return acc;
  }, {});
  const list = (users ?? []).map((u) => ({
    id: u.id,
    role: u.role,
    created_at: u.created_at,
    display_name: (u as { display_name?: string | null }).display_name ?? null,
    avatar_url: (u as { avatar_url?: string | null }).avatar_url ?? null,
    permissions: permsByUser[u.id] ?? [],
  }));
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'superadmin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const { email, permissions } = body;
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }
  const emailNorm = email.trim().toLowerCase();
  if (!isAdminEmail(emailNorm)) {
    return NextResponse.json({ error: 'only @gboyinwa.com emails can be admins' }, { status: 400 });
  }
  const supabase = getServiceClient();
  const emailHash = hashEmail(emailNorm);
  const { data: existing } = await supabase.from('users').select('id').eq('email_hash', emailHash).single();
  if (existing) return NextResponse.json({ error: 'user already exists' }, { status: 409 });
  const tempPassword = generatePassword();
  
  // Use Web Crypto API for password hashing (works on Edge)
  const passwordHash = await hashPassword(tempPassword);
  
  let emailEncrypted: string | null = null;
  try {
    emailEncrypted = encryptPii(emailNorm);
  } catch {
    return NextResponse.json({ error: 'encryption not configured' }, { status: 500 });
  }
  const displayName = deriveDisplayName(emailNorm);
  const { data: user, error: insertErr } = await supabase
    .from('users')
    .insert({
      email_hash: emailHash,
      email_encrypted: emailEncrypted,
      password_hash: passwordHash,
      role: 'admin',
      display_name: displayName,
    })
    .select('id')
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  const permList = Array.isArray(permissions) ? permissions : [];
  if (permList.length > 0) {
    await supabase.from('user_permissions').insert(
      permList.map((p: string) => ({ user_id: user.id, permission: p }))
    );
  }
  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const loginUrl = `${baseUrl.replace(/\/$/, '')}/login`;
  const emailPayload = adminInviteEmailPayload(loginUrl, tempPassword, displayName);
  emailPayload.to = emailNorm;
  const sent = await sendEmail(emailPayload);
  if (!sent) {
    console.error('admin invite email failed to send; user created with temp password');
  }
  return NextResponse.json({ id: user.id, role: 'admin', emailSent: sent });
}
