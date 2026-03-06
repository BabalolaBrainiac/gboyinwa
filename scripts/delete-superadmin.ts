/**
 * Script to delete existing superadmin(s) - run before creating new superadmin
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('.env.local') });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  // Get all superadmins
  const { data: superadmins, error } = await supabase
    .from('users')
    .select('id, role, email_hash')
    .eq('role', 'superadmin');

  if (error) {
    console.error('Error fetching superadmins:', error.message);
    process.exit(1);
  }

  if (!superadmins || superadmins.length === 0) {
    console.log('No superadmins found.');
    return;
  }

  console.log(`Found ${superadmins.length} superadmin(s):`);
  for (const sa of superadmins) {
    console.log(`  - ID: ${sa.id}, Email Hash: ${sa.email_hash?.slice(0, 20)}...`);
  }

  // Delete all superadmins and their permissions
  for (const sa of superadmins) {
    // Delete permissions first (foreign key constraint)
    const { error: permError } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', sa.id);

    if (permError) {
      console.error(`Failed to delete permissions for ${sa.id}:`, permError.message);
      continue;
    }

    // Delete the user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', sa.id);

    if (userError) {
      console.error(`Failed to delete user ${sa.id}:`, userError.message);
    } else {
      console.log(`Deleted superadmin: ${sa.id}`);
    }
  }

  console.log('\nSuperadmin deletion complete.');
}

main();
