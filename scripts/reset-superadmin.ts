/**
 * Reset Superadmin Script
 * 
 * This script:
 * 1. Deletes ALL existing superadmin users from the database
 * 2. Creates a new superadmin user with email: babalolaopedaniel@gmail.com
 * 3. Returns the generated password
 * 
 * Usage: npx tsx scripts/reset-superadmin.ts
 */

import { config } from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Password hashing config (must match lib/password.ts)
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;
const ITERATIONS = 100000;

// Encryption config (must match lib/encrypt.ts)
const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const TAG_LEN = 16;
const KEY_LEN = 32;

// ============================================================================
// Helper Functions (copied from lib/* to avoid module import issues)
// ============================================================================

function hashEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < KEY_LEN * 2) {
    throw new Error('ENCRYPTION_KEY must be 64-char hex (32 bytes)');
  }
  return Buffer.from(raw.slice(0, KEY_LEN * 2), 'hex');
}

function encryptPii(plain: string): string {
  if (!plain) return '';
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LEN);
  const cipher = require('crypto').createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  const chars: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    chars.push(String.fromCharCode(arr[i]!));
  }
  return Buffer.from(chars.join(''), 'binary').toString('base64');
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const passwordData = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  const hashArray = new Uint8Array(hash);
  const result = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  result.set(salt);
  result.set(hashArray, SALT_LENGTH);

  return uint8ArrayToBase64(result);
}

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

// ============================================================================
// Supabase Client
// ============================================================================

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ============================================================================
// Main Script
// ============================================================================

const SUPERADMIN_EMAIL = 'babalolaopedaniel@gmail.com';

async function main() {
  console.log('='.repeat(60));
  console.log('SUPERADMIN RESET SCRIPT');
  console.log('='.repeat(60));
  console.log('');

  // Check environment
  if (!process.env.ENCRYPTION_KEY) {
    console.error('ERROR: ENCRYPTION_KEY environment variable is required');
    process.exit(1);
  }

  const supabase = getServiceClient();

  // Step 1: Find and delete all existing superadmins
  console.log('Step 1: Finding existing superadmins...');
  const { data: existingSuperadmins, error: fetchError } = await supabase
    .from('users')
    .select('id, email_hash')
    .eq('role', 'superadmin');

  if (fetchError) {
    console.error('ERROR: Failed to fetch superadmins:', fetchError.message);
    process.exit(1);
  }

  const superadminCount = existingSuperadmins?.length ?? 0;
  console.log(`Found ${superadminCount} existing superadmin(s)`);

  if (superadminCount > 0) {
    console.log('Deleting existing superadmins...');
    
    for (const admin of existingSuperadmins ?? []) {
      console.log(`  - Deleting superadmin ID: ${admin.id}`);
      
      // Delete user permissions first (cascade should handle this, but be explicit)
      const { error: permError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', admin.id);
      
      if (permError) {
        console.error(`  WARNING: Failed to delete permissions for ${admin.id}:`, permError.message);
      }

      // Delete the user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', admin.id);
      
      if (deleteError) {
        console.error(`  ERROR: Failed to delete superadmin ${admin.id}:`, deleteError.message);
        process.exit(1);
      }
    }
    console.log('All existing superadmins deleted successfully\n');
  } else {
    console.log('No existing superadmins to delete\n');
  }

  // Step 2: Create new superadmin
  console.log('Step 2: Creating new superadmin...');
  console.log(`  Email: ${SUPERADMIN_EMAIL}`);

  const emailNorm = SUPERADMIN_EMAIL.trim().toLowerCase();
  const emailHash = hashEmail(emailNorm);
  
  // Check if a user with this email already exists (as non-superadmin)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('email_hash', emailHash)
    .single();

  if (existingUser) {
    console.log(`User with this email exists as ${existingUser.role}, deleting first...`);
    await supabase.from('user_permissions').delete().eq('user_id', existingUser.id);
    await supabase.from('users').delete().eq('id', existingUser.id);
  }

  // Generate password and hash it
  const tempPassword = generatePassword();
  const passwordHash = await hashPassword(tempPassword);

  // Encrypt email
  let emailEncrypted: string;
  try {
    emailEncrypted = encryptPii(emailNorm);
  } catch (e: any) {
    console.error('ERROR: Failed to encrypt email:', e.message);
    process.exit(1);
  }

  const displayName = deriveDisplayName(emailNorm);

  // Insert the new superadmin
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      email_hash: emailHash,
      email_encrypted: emailEncrypted,
      password_hash: passwordHash,
      role: 'superadmin',
      display_name: displayName,
    })
    .select('id, role, created_at')
    .single();

  if (insertError) {
    console.error('ERROR: Failed to create superadmin:', insertError.message);
    process.exit(1);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('SUCCESS! New superadmin created:');
  console.log('='.repeat(60));
  console.log(`  User ID:    ${newUser.id}`);
  console.log(`  Email:      ${SUPERADMIN_EMAIL}`);
  console.log(`  Role:       ${newUser.role}`);
  console.log(`  Created:    ${newUser.created_at}`);
  console.log('');
  console.log('='.repeat(60));
  console.log('GENERATED PASSWORD (SAVE THIS!):');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  ${tempPassword}`);
  console.log('');
  console.log('='.repeat(60));
  console.log('');

  return { user: newUser, password: tempPassword };
}

main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
