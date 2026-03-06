/**
 * One-time script to create the first (and only) superadmin.
 * Run once: CREATE_SUPERADMIN_EMAIL=you@example.com npx tsx scripts/create-superadmin.ts
 * Optional: CREATE_SUPERADMIN_DISPLAY_NAME=Opeyemi
 * Password is auto-generated and printed once. Store it securely; then log in and create other admins.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = process.cwd();
config({ path: resolve(projectRoot, '.env') });
config({ path: resolve(projectRoot, '.env.local') });

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { hashEmail } from '../lib/hash';
import { encryptPii } from '../lib/encrypt';
import { randomBytes } from 'crypto';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    console.error(`missing env: ${name}`);
    console.error(`add it to ${resolve(projectRoot, '.env.local')} (copy from env.example).`);
    process.exit(1);
  }
  return v.trim();
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const buf = randomBytes(24);
  let s = '';
  for (let i = 0; i < 24; i++) s += chars[buf[i]! % chars.length];
  return s;
}

function deriveDisplayName(email: string): string {
  const part = email.split('@')[0] ?? email;
  const cleaned = part.replace(/[._0-9]+/g, ' ').trim() || part;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const email = requireEnv('CREATE_SUPERADMIN_EMAIL').toLowerCase().trim();
  const displayName = process.env.CREATE_SUPERADMIN_DISPLAY_NAME?.trim() || deriveDisplayName(email);

  const supabase = createClient(url, serviceKey);

  const { data: existingSuper } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'superadmin')
    .limit(1)
    .maybeSingle();

  if (existingSuper) {
    console.error('a superadmin already exists. this script can only run once.');
    process.exit(1);
  }

  const emailHash = hashEmail(email);
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email_hash', emailHash)
    .maybeSingle();

  if (existingUser) {
    console.error('user with this email already exists');
    process.exit(1);
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);
  let emailEncrypted: string | null = null;
  try {
    emailEncrypted = encryptPii(email);
  } catch {
    console.error('ENCRYPTION_KEY must be set (64-char hex) for storing email');
    process.exit(1);
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email_hash: emailHash,
      email_encrypted: emailEncrypted,
      password_hash: passwordHash,
      role: 'superadmin',
      display_name: displayName,
    })
    .select('id')
    .single();

  if (error) {
    console.error('insert failed:', error.message);
    process.exit(1);
  }

  console.log('superadmin created. id:', user.id);
  console.log('');
  console.log('--- save these credentials securely (they will not be shown again) ---');
  console.log('email:', email);
  console.log('password:', password);
  console.log('---');
  console.log('log in at your app login page, then add other admins from the admin panel.');
}

main();
