#!/usr/bin/env tsx
/**
 * Upload all static assets to Cloudflare R2
 * Run: npx dotenv -e .env.local -- npx tsx scripts/upload-assets.ts
 *
 * Folder structure in R2:
 *   assets/logos/   — brand logos (PNG)
 *   assets/team/    — team member photos (JPG)
 *   avatars/        — admin profile photos (managed by app)
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

// ── Credentials ────────────────────────────────────────────────────────────────
const R2_ACCOUNT_ID      = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID   = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME     = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL      = process.env.R2_PUBLIC_URL;

const missing = [
  !R2_ACCOUNT_ID       && 'R2_ACCOUNT_ID',
  !R2_ACCESS_KEY_ID    && 'R2_ACCESS_KEY_ID',
  !R2_SECRET_ACCESS_KEY && 'R2_SECRET_ACCESS_KEY',
  !R2_BUCKET_NAME      && 'R2_BUCKET_NAME',
].filter(Boolean);

if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  console.error('Run: npx dotenv -e .env.local -- npx tsx scripts/upload-assets.ts');
  process.exit(1);
}

if (R2_ACCESS_KEY_ID && R2_ACCESS_KEY_ID.includes('PASTE')) {
  console.error('R2_ACCESS_KEY_ID is still a placeholder. Set the real 32-char key in .env.local first.');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

const ROOT = join(process.cwd());

// ── Asset manifest ─────────────────────────────────────────────────────────────
// { localPath: relative from project root, r2Key: destination in bucket }
const ASSETS: { local: string; key: string; mime: string }[] = [
  // Brand logos
  { local: 'public/images/logo-full.png',        key: 'assets/logos/logo-full.png',        mime: 'image/png' },
  { local: 'public/images/logo-standard.png',    key: 'assets/logos/logo-standard.png',    mime: 'image/png' },
  { local: 'public/images/logo.png',             key: 'assets/logos/logo.png',             mime: 'image/png' },
  { local: 'public/images/logomark-yellow.png',  key: 'assets/logos/logomark-yellow.png',  mime: 'image/png' },
  { local: 'public/images/logomark.png',         key: 'assets/logos/logomark.png',         mime: 'image/png' },
  { local: 'public/images/logotype.png',         key: 'assets/logos/logotype.png',         mime: 'image/png' },

  // Team photos — using the properly named files from public/images/team/
  { local: 'public/images/team/daniel.jpg',           key: 'assets/team/daniel.jpg',           mime: 'image/jpeg' },
  { local: 'public/images/team/karamat.jpg',          key: 'assets/team/karamat.jpg',          mime: 'image/jpeg' },
  { local: 'public/images/team/oluwatimilehin.jpg',   key: 'assets/team/oluwatimilehin.jpg',   mime: 'image/jpeg' },
  { local: 'public/images/team/opeyemi.jpg',          key: 'assets/team/opeyemi.jpg',          mime: 'image/jpeg' },
  { local: 'public/images/team/tari.jpg',             key: 'assets/team/tari.jpg',             mime: 'image/jpeg' },
  { local: 'public/images/team/victoria.jpg',         key: 'assets/team/victoria.jpg',         mime: 'image/jpeg' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
async function keyExists(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: key }));
    return true;
  } catch {
    return false;
  }
}

function publicUrl(key: string): string {
  return R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

// ── Upload ─────────────────────────────────────────────────────────────────────
async function uploadAsset(asset: typeof ASSETS[0], force = false): Promise<string> {
  const localPath = join(ROOT, asset.local);

  if (!existsSync(localPath)) {
    console.warn(`  SKIP (not found): ${asset.local}`);
    return '';
  }

  if (!force && await keyExists(asset.key)) {
    const url = publicUrl(asset.key);
    console.log(`  SKIP (exists):  ${asset.key}`);
    return url;
  }

  const buffer = readFileSync(localPath);
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: asset.key,
    Body: buffer,
    ContentType: asset.mime,
    ContentLength: buffer.length,
    CacheControl: 'public, max-age=31536000, immutable',
    Metadata: {
      'source': Buffer.from(asset.local).toString('base64'),
      'uploaded-at': new Date().toISOString(),
    },
  }));

  const url = publicUrl(asset.key);
  console.log(`  OK:  ${asset.key}  (${(buffer.length / 1024).toFixed(1)} KB)`);
  return url;
}

async function main() {
  const force = process.argv.includes('--force');
  console.log(`\nUploading assets to R2 bucket: ${R2_BUCKET_NAME}`);
  console.log(`Endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
  if (force) console.log('Mode: --force (overwrite existing files)');
  console.log('');

  const results: { key: string; url: string }[] = [];
  let skipped = 0;
  let uploaded = 0;
  let failed = 0;

  for (const asset of ASSETS) {
    try {
      const url = await uploadAsset(asset, force);
      if (url) {
        results.push({ key: asset.key, url });
        if (url && !url.includes('SKIP')) {
          const existed = !force && await keyExists(asset.key);
          // just track uploaded vs skipped via log output
        }
      }
    } catch (err) {
      console.error(`  FAIL: ${asset.key}`, (err as Error).message);
      failed++;
    }
  }

  // Summary
  console.log('\n── R2 URLs ────────────────────────────────────────────────────────');
  for (const r of results) {
    if (r.url) console.log(`${r.key}\n  → ${r.url}\n`);
  }

  if (failed > 0) {
    console.error(`\n${failed} upload(s) failed.`);
    process.exit(1);
  } else {
    console.log('All assets processed successfully.');
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
