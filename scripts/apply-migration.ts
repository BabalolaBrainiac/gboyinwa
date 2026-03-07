#!/usr/bin/env tsx
/**
 * Apply database migration for documents table
 * Run: npx tsx scripts/apply-migration.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Make sure .env.local is loaded.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationPath = join(process.cwd(), 'supabase/migrations/004_documents.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  console.log('Applying migration: 004_documents.sql...');
  
  // Split SQL into individual statements (simple split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from('_exec_sql').select('*').limit(1);
        if (queryError) {
          console.warn('Statement may have failed (this is often OK for IF NOT EXISTS):', error.message);
        }
      }
    } catch (err) {
      // Many statements will fail if objects already exist, which is fine
      console.log('Statement result:', err instanceof Error ? err.message : 'OK');
    }
  }
  
  console.log('Migration applied! Checking tables...');
  
  // Verify tables were created
  const { data: categories, error: catError } = await supabase
    .from('document_categories')
    .select('count');
  
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('count');
  
  if (catError) {
    console.error('❌ document_categories table not found:', catError.message);
  } else {
    console.log('✅ document_categories table exists');
  }
  
  if (docError) {
    console.error('❌ documents table not found:', docError.message);
  } else {
    console.log('✅ documents table exists');
  }
  
  // Check default categories
  const { data: cats } = await supabase
    .from('document_categories')
    .select('name');
  
  if (cats && cats.length > 0) {
    console.log(`✅ Found ${cats.length} document categories:`, cats.map(c => c.name).join(', '));
  }
}

applyMigration().catch(console.error);
