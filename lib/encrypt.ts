import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const TAG_LEN = 16;
const KEY_LEN = 32;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < KEY_LEN * 2) {
    throw new Error('ENCRYPTION_KEY must be 64-char hex (32 bytes)');
  }
  return Buffer.from(raw.slice(0, KEY_LEN * 2), 'hex');
}

export function encryptPii(plain: string): string {
  if (!plain) return '';
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function decryptPii(encrypted: string): string {
  if (!encrypted) return '';
  const key = getKey();
  const buf = Buffer.from(encrypted, 'base64url');
  if (buf.length < IV_LEN + TAG_LEN) return '';
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}
