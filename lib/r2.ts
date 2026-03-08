import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  UploadPartCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Validate on module load
const missingVars = [
  !R2_ACCOUNT_ID && 'R2_ACCOUNT_ID',
  !R2_ACCESS_KEY_ID && 'R2_ACCESS_KEY_ID',
  !R2_SECRET_ACCESS_KEY && 'R2_SECRET_ACCESS_KEY',
  !R2_BUCKET_NAME && 'R2_BUCKET_NAME',
].filter(Boolean);

if (missingVars.length) {
  console.error('[R2] Missing environment variables:', missingVars.join(', '));
}
if (R2_ACCESS_KEY_ID && R2_ACCESS_KEY_ID.length !== 32) {
  console.error(`[R2] R2_ACCESS_KEY_ID is ${R2_ACCESS_KEY_ID.length} chars — must be exactly 32. Check Cloudflare Dashboard > R2 > Manage R2 API Tokens.`);
}

// Custom HTTPS agent: TLS 1.2 minimum, no keepAlive (avoids stale socket issues)
const r2HttpsAgent = new https.Agent({
  minVersion: 'TLSv1.2',
  rejectUnauthorized: true,
  keepAlive: false,
});

let s3Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
      requestHandler: new NodeHttpHandler({
        httpsAgent: r2HttpsAgent,
        connectionTimeout: 15_000,  // 15s to establish connection
        requestTimeout: 300_000,    // 5 min for actual data transfer
      }),
    });
  }
  return s3Client;
}

// Reset client (useful after credential change)
export function resetR2Client() {
  s3Client = null;
}

// Upload file to R2
export async function uploadToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  category: string = 'general',
  folderPath: string = '/',
  onProgress?: (pct: number) => void,
): Promise<{ url: string; key: string }> {
  const uploadId = Math.random().toString(36).slice(2, 8);
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

  console.log(`[R2:${uploadId}] Upload start — file: "${fileName}", size: ${sizeMB}MB, type: ${contentType}, category: ${category}`);

  const client = getR2Client();

  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(fileName.replace(/\.[^/.]+$/, ''));
  const extension = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const uniqueFileName = `${timestamp}_${sanitizedName}.${extension}`;

  const normalizedFolder = folderPath === '/' ? '' : folderPath.replace(/^\//, '').replace(/\/$/, '');
  const key = normalizedFolder
    ? `${category}/${normalizedFolder}/${uniqueFileName}`
    : `${category}/${uniqueFileName}`;

  console.log(`[R2:${uploadId}] Uploading to key: ${key}`);

  // Encode filename for safe HTTP header value
  const safeOriginalName = Buffer.from(fileName).toString('base64');

  const startTime = Date.now();
  try {
    await client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
      Metadata: {
        'original-name': safeOriginalName,
        'uploaded-at': new Date().toISOString(),
      },
    }));
  } catch (err: unknown) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const e = err as { name?: string; Code?: string; message?: string; $metadata?: { httpStatusCode?: number } };
    console.error(`[R2:${uploadId}] Upload FAILED after ${elapsed}s`);
    console.error(`[R2:${uploadId}] Error code: ${e.Code || e.name}`);
    console.error(`[R2:${uploadId}] HTTP status: ${e.$metadata?.httpStatusCode}`);
    console.error(`[R2:${uploadId}] Message: ${e.message}`);

    // Emit useful diagnostic
    if (e.name === 'InvalidAccessKeyId' || e.Code === 'InvalidAccessKeyId') {
      throw new Error('R2 auth failed: Access Key ID is invalid. Go to Cloudflare Dashboard > R2 > Manage R2 API Tokens to get the correct 32-char Access Key ID.');
    }
    if (e.name === 'SignatureDoesNotMatch' || e.Code === 'SignatureDoesNotMatch') {
      throw new Error('R2 auth failed: Secret Access Key is wrong. Check R2_SECRET_ACCESS_KEY in .env.local.');
    }
    if (e.name === 'NoSuchBucket' || e.Code === 'NoSuchBucket') {
      throw new Error(`R2 bucket "${R2_BUCKET_NAME}" not found. Create it in Cloudflare Dashboard > R2.`);
    }
    throw new Error(`R2 upload failed (${e.Code || e.name}): ${e.message}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[R2:${uploadId}] Upload complete in ${elapsed}s — key: ${key}`);

  const url = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return { url, key };
}

// Upload file stream to R2 using multipart upload for large files
export async function uploadStreamToR2(
  stream: ReadableStream,
  fileName: string,
  contentType: string,
  fileSize: number,
  category: string = 'general',
  folderPath: string = '/',
): Promise<{ url: string; key: string }> {
  const uploadId = Math.random().toString(36).slice(2, 8);
  const sizeMB = (fileSize / 1024 / 1024).toFixed(2);

  console.log(`[R2:${uploadId}] Stream upload start — file: "${fileName}", size: ${sizeMB}MB, type: ${contentType}, category: ${category}`);

  const client = getR2Client();

  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(fileName.replace(/\.[^/.]+$/, ''));
  const extension = fileName.split('.').pop()?.toLowerCase() || 'bin';
  const uniqueFileName = `${timestamp}_${sanitizedName}.${extension}`;

  const normalizedFolder = folderPath === '/' ? '' : folderPath.replace(/^\//, '').replace(/\/$/, '');
  const key = normalizedFolder
    ? `${category}/${normalizedFolder}/${uniqueFileName}`
    : `${category}/${uniqueFileName}`;

  console.log(`[R2:${uploadId}] Uploading to key: ${key}`);

  // Encode filename for safe HTTP header value
  const safeOriginalName = Buffer.from(fileName).toString('base64');

  // For small files (< 100MB), use single-part upload with streaming
  const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MB
  
  if (fileSize < MULTIPART_THRESHOLD) {
    // Read stream into buffer (for smaller files)
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    // Combine chunks into single buffer
    const buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    
    const startTime = Date.now();
    try {
      await client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
        Metadata: {
          'original-name': safeOriginalName,
          'uploaded-at': new Date().toISOString(),
        },
      }));
    } catch (err: unknown) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const e = err as { name?: string; Code?: string; message?: string; $metadata?: { httpStatusCode?: number } };
      console.error(`[R2:${uploadId}] Upload FAILED after ${elapsed}s`);
      console.error(`[R2:${uploadId}] Error code: ${e.Code || e.name}`);
      console.error(`[R2:${uploadId}] HTTP status: ${e.$metadata?.httpStatusCode}`);
      console.error(`[R2:${uploadId}] Message: ${e.message}`);
      throw new Error(`R2 upload failed: ${e.message}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[R2:${uploadId}] Upload complete in ${elapsed}s — key: ${key}`);
  } else {
    // Multipart upload for large files (100MB+)
    console.log(`[R2:${uploadId}] Using multipart upload for large file...`);
    const startTime = Date.now();
    
    let multipartUploadId: string;
    try {
      const createResponse = await client.send(new CreateMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Metadata: {
          'original-name': safeOriginalName,
          'uploaded-at': new Date().toISOString(),
        },
      }));
      multipartUploadId = createResponse.UploadId!;
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      throw new Error(`Failed to initiate multipart upload: ${e.message}`);
    }

    const partSize = 10 * 1024 * 1024; // 10 MB parts
    const parts: { ETag: string; PartNumber: number }[] = [];
    let partNumber = 1;

    try {
      const reader = stream.getReader();
      let buffer = Buffer.alloc(0);

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          buffer = Buffer.concat([buffer, Buffer.from(value)]);
        }

        // Upload part when buffer reaches part size or stream ends
        if (buffer.length >= partSize || (done && buffer.length > 0)) {
          const uploadBuffer = buffer.slice(0, partSize);
          buffer = buffer.slice(partSize);

          console.log(`[R2:${uploadId}] Uploading part ${partNumber} (${formatFileSize(uploadBuffer.length)})...`);
          
          const partResponse = await client.send(new UploadPartCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            UploadId: multipartUploadId,
            PartNumber: partNumber,
            Body: uploadBuffer,
          }));

          parts.push({
            ETag: partResponse.ETag!,
            PartNumber: partNumber,
          });

          console.log(`[R2:${uploadId}] Part ${partNumber} uploaded successfully`);
          partNumber++;
        }

        if (done) break;
      }

      // Complete multipart upload
      console.log(`[R2:${uploadId}] Completing multipart upload (${parts.length} parts)...`);
      await client.send(new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        UploadId: multipartUploadId,
        MultipartUpload: { Parts: parts },
      }));

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[R2:${uploadId}] Multipart upload complete in ${elapsed}s — key: ${key}`);

    } catch (err: unknown) {
      // Abort multipart upload on error
      console.error(`[R2:${uploadId}] Multipart upload failed, aborting...`);
      try {
        await client.send(new AbortMultipartUploadCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          UploadId: multipartUploadId,
        }));
      } catch (abortErr) {
        console.error(`[R2:${uploadId}] Failed to abort multipart upload:`, abortErr);
      }
      const e = err as { name?: string; message?: string };
      throw new Error(`Multipart upload failed: ${e.message}`);
    }
  }

  const url = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return { url, key };
}

// Get a signed URL for temporary private access
export async function getSignedFileUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

// Delete file from R2
export async function deleteFromR2(key: string): Promise<void> {
  console.log(`[R2] Deleting key: ${key}`);
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
  console.log(`[R2] Deleted: ${key}`);
}

// Check if file exists
export async function fileExists(key: string): Promise<boolean> {
  const client = getR2Client();
  try {
    await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// Sanitize filename: lowercase, alphanumeric + dash/underscore, max 80 chars
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 80) || 'file';
}

// ─── Validation ─────────────────────────────────────────────────────────────

// Allowed MIME types (strict whitelist)
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  // Documents
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
  'application/vnd.oasis.opendocument.text': ['odt'],
  'application/vnd.oasis.opendocument.spreadsheet': ['ods'],
  'application/vnd.oasis.opendocument.presentation': ['odp'],
  // Images
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'image/svg+xml': ['svg'],
  // Video
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov'],
  // Audio
  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav'],
  'audio/ogg': ['ogg'],
  // Archives / Text
  'application/zip': ['zip'],
  'text/plain': ['txt'],
  'text/csv': ['csv'],
};

// Magic byte signatures for common types
const MAGIC_BYTES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'application/pdf',  bytes: [0x25, 0x50, 0x44, 0x46] },            // %PDF
  { mime: 'image/jpeg',       bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',        bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',        bytes: [0x47, 0x49, 0x46, 0x38] },            // GIF8
  { mime: 'image/webp',       bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF (check further for WEBP)
  { mime: 'video/mp4',        bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
  { mime: 'application/zip',  bytes: [0x50, 0x4B, 0x03, 0x04] },            // PK (zip)
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

export function validateUpload(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  maxBytes = 200 * 1024 * 1024, // 200MB default
): ValidationResult {
  // 1. Size check
  if (fileBuffer.length === 0) {
    return { valid: false, error: 'File is empty.' };
  }
  if (fileBuffer.length > maxBytes) {
    return { valid: false, error: `File too large (${formatFileSize(fileBuffer.length)}). Max allowed: ${formatFileSize(maxBytes)}.` };
  }

  // 2. MIME type whitelist
  if (!ALLOWED_MIME_TYPES[mimeType]) {
    return { valid: false, error: `File type "${mimeType}" is not allowed.` };
  }

  // 3. Extension matches declared MIME type
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const allowedExts = ALLOWED_MIME_TYPES[mimeType];
  if (allowedExts && !allowedExts.includes(ext)) {
    return { valid: false, error: `File extension ".${ext}" does not match declared type "${mimeType}".` };
  }

  // 4. Magic bytes check (where applicable)
  const magic = MAGIC_BYTES.find(m => m.mime === mimeType);
  if (magic) {
    const offset = magic.offset ?? 0;
    const match = magic.bytes.every((b, i) => fileBuffer[offset + i] === b);
    if (!match) {
      // Some Office files are ZIP-based — allow zip magic for them
      const isOfficeMime =
        mimeType.includes('openxmlformats') ||
        mimeType.includes('opendocument') ||
        mimeType.includes('msword') ||
        mimeType.includes('ms-excel') ||
        mimeType.includes('ms-powerpoint');
      const hasZipMagic = fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B;
      if (!(isOfficeMime && hasZipMagic)) {
        return { valid: false, error: `File content does not match declared type "${mimeType}". Possible file tampering.` };
      }
    }
  }

  // 5. Sanitize file name
  const namePart = fileName.replace(/\.[^/.]+$/, '');
  const sanitizedName = namePart
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\.{2,}/g, '_')
    .trim()
    .substring(0, 200) || 'document';

  return { valid: true, sanitizedName };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + units[i];
}

// Keep for backwards compat
export function validateFile(
  file: { size: number; type: string; name: string },
  _allowedTypes?: string[],
  maxSizeBytes = 200 * 1024 * 1024,
): { valid: boolean; error?: string } {
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File too large. Max: ${formatFileSize(maxSizeBytes)}.` };
  }
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return { valid: false, error: `File type "${file.type}" is not allowed.` };
  }
  return { valid: true };
}

export function getFileIconType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  return 'file';
}

export const SUPPORTED_DOCUMENT_TYPES = Object.keys(ALLOWED_MIME_TYPES);
