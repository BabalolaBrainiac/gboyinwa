import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getSignedFileUrl } from './r2';

const execFileAsync = promisify(execFile);

/** Files above this size won't load in the Office Online viewer (25 MB limit). */
export const SLIDE_MAX_BYTES = 25 * 1024 * 1024;

export interface SlidePreviewMeta {
  converted_at: string;
  slide_count: number;
  /** R2 object keys for each slide PNG, sorted slide_001.png … slide_NNN.png */
  keys: string[];
}

/** Returns true when the file is an Office doc too large for the Online viewer. */
export function isLargeOfficeFile(mimeType: string, fileName: string, fileSize: number): boolean {
  const name = fileName.toLowerCase();
  const isOffice =
    mimeType.includes('presentationml') || mimeType.includes('powerpoint') ||
    mimeType.includes('spreadsheetml')  || mimeType.includes('excel')      ||
    mimeType.includes('wordprocessingml') || mimeType.includes('word')     ||
    mimeType.includes('opendocument')   ||
    name.endsWith('.pptx') || name.endsWith('.ppt') ||
    name.endsWith('.xlsx') || name.endsWith('.xls') ||
    name.endsWith('.docx') || name.endsWith('.doc') ||
    name.endsWith('.odp')  || name.endsWith('.ods') || name.endsWith('.odt');
  return isOffice && fileSize > SLIDE_MAX_BYTES;
}

/**
 * Downloads an Office document from R2, converts every slide/page to a PNG,
 * uploads the PNGs back to R2, and returns the metadata.
 *
 * Backends (tried in order):
 *  1. GOTENBERG_URL env var is set → POST to Gotenberg (LibreOffice container)
 *     to get a PDF, then render each page to PNG via pdfjs-dist + canvas.
 *     Requires: npm install pdfjs-dist canvas
 *  2. Otherwise → LibreOffice CLI (`libreoffice --convert-to png`).
 *     Requires: LibreOffice installed on the host.
 */
export async function convertDocumentToSlides(
  fileKey: string,
  documentId: string,
  fileName: string,
): Promise<SlidePreviewMeta> {
  // 1. Download the original file from R2
  const signedUrl = await getSignedFileUrl(fileKey, 3600);
  const fileResponse = await fetch(signedUrl);
  if (!fileResponse.ok) {
    throw new Error(`Failed to download file from storage: HTTP ${fileResponse.status}`);
  }
  const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

  // 2. Work inside a temp directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'slides-'));
  try {
    const inputFile = path.join(tempDir, fileName);
    const outputDir = path.join(tempDir, 'out');
    await fs.writeFile(inputFile, fileBuffer);
    await fs.mkdir(outputDir);

    // 3. Convert → array of PNG paths
    let pngPaths: string[];
    if (process.env.GOTENBERG_URL) {
      pngPaths = await convertViaGotenberg(fileBuffer, fileName, outputDir);
    } else {
      pngPaths = await convertViaLibreOffice(inputFile, outputDir);
    }

    if (pngPaths.length === 0) {
      throw new Error('No slides were produced — check that the file is a valid Office document.');
    }

    // Sort numerically (libreoffice produces "filename1.png", "filename2.png" …)
    pngPaths.sort((a, b) => {
      const numA = parseInt(path.basename(a).match(/(\d+)/)?.[1] ?? '0', 10);
      const numB = parseInt(path.basename(b).match(/(\d+)/)?.[1] ?? '0', 10);
      return numA - numB;
    });

    // 4. Upload each PNG to R2
    const r2 = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;
    const keys: string[] = [];

    for (let i = 0; i < pngPaths.length; i++) {
      const pngBuf = await fs.readFile(pngPaths[i]);
      const key = `slides/${documentId}/slide_${String(i + 1).padStart(3, '0')}.png`;
      await r2.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: pngBuf,
        ContentType: 'image/png',
      }));
      keys.push(key);
    }

    return { converted_at: new Date().toISOString(), slide_count: pngPaths.length, keys };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ── Backend: LibreOffice CLI ─────────────────────────────────────────────────

async function convertViaLibreOffice(inputFile: string, outputDir: string): Promise<string[]> {
  try {
    await execFileAsync(
      'libreoffice',
      ['--headless', '--norestore', '--convert-to', 'png', '--outdir', outputDir, inputFile],
      { timeout: 180_000 }, // 3 min
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ENOENT') || msg.includes('not found')) {
      throw new Error(
        'LibreOffice is not installed on this server. ' +
        'Install LibreOffice or set the GOTENBERG_URL environment variable to use a Gotenberg service.',
      );
    }
    throw err;
  }
  const files = await fs.readdir(outputDir);
  return files.filter(f => f.endsWith('.png')).map(f => path.join(outputDir, f));
}

// ── Backend: Gotenberg (PPTX → PDF) + pdfjs-dist (PDF → PNG) ────────────────

async function convertViaGotenberg(
  fileBuffer: Buffer,
  fileName: string,
  outputDir: string,
): Promise<string[]> {
  const gotenbergUrl = process.env.GOTENBERG_URL!;

  // Step 1 — PPTX → PDF via Gotenberg LibreOffice route
  const form = new FormData();
  form.append('files', new Blob([new Uint8Array(fileBuffer)]), fileName);

  const pdfRes = await fetch(`${gotenbergUrl}/forms/libreoffice/convert`, {
    method: 'POST',
    body: form,
  });
  if (!pdfRes.ok) {
    throw new Error(`Gotenberg PDF conversion failed with status ${pdfRes.status}`);
  }
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

  // Step 2 — PDF → PNG per page
  return pdfToImages(pdfBuffer, outputDir);
}

async function pdfToImages(pdfBuffer: Buffer, outputDir: string): Promise<string[]> {
  // These packages are optional — only required for the Gotenberg path.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdfjsLib: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let canvasLib: any;
  try {
    // Use require() so TypeScript doesn't validate the uninstalled module types
    pdfjsLib  = await eval('import("pdfjs-dist")');
    canvasLib = await eval('import("canvas")');
  } catch {
    throw new Error(
      'The Gotenberg conversion path requires "pdfjs-dist" and "canvas" npm packages.\n' +
      'Run: npm install pdfjs-dist canvas\n' +
      'Or install LibreOffice on the host and remove GOTENBERG_URL to use the CLI backend.',
    );
  }

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const files: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 2.0 }); // 2× scale ≈ 1920 px wide for 16:9
    const cv = canvasLib.createCanvas(vp.width, vp.height);
    const ctx = cv.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const outPath = path.join(outputDir, `page_${String(p).padStart(3, '0')}.png`);
    await fs.writeFile(outPath, cv.toBuffer('image/png'));
    files.push(outPath);
  }
  return files;
}
