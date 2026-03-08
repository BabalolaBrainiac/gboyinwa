import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getDocuments, createDocument, getDocumentCategories, searchDocuments } from '@/lib/documents';
import { uploadToR2, uploadStreamToR2, validateUpload, formatFileSize } from '@/lib/r2';

export const dynamic = 'force-dynamic';
// Allow up to 5 minutes for large file uploads on serverless
export const maxDuration = 300;

// Disable body parser to handle large file uploads (bypasses Vercel's default 4.5MB limit)
export const config = {
  api: {
    bodyParser: false,
  },
};

// ── In-memory category cache (categories change rarely) ──────────────────────
let categoriesCache: { data: unknown[]; expiresAt: number } | null = null;
const CATEGORIES_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedCategories() {
  const now = Date.now();
  if (categoriesCache && categoriesCache.expiresAt > now) return categoriesCache.data;
  const data = await getDocumentCategories();
  categoriesCache = { data, expiresAt: now + CATEGORIES_TTL };
  return data;
}

// ─── GET — list documents ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role?: string }).role || '';
    const permissions = (session.user as { permissions?: string[] }).permissions || [];

    if (!hasPermission(role, permissions, 'documents:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const folderPath = searchParams.get('folder');
    const searchQuery = searchParams.get('search');
    const fileType = searchParams.get('type');

    const [documents, categories] = await Promise.all([
      searchQuery
        ? searchDocuments(searchQuery)
        : getDocuments({
            categoryId: categoryId || undefined,
            folderPath: folderPath || undefined,
            fileType: fileType || undefined,
          }),
      getCachedCategories(),
    ]);

    return NextResponse.json({ documents, categories }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('[documents:GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// ─── POST — upload document ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const t = (label: string) => console.log(`[upload:${reqId}] ${label}`);

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    t('Checking session...');
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role?: string }).role || '';
    const permissions = (session.user as { permissions?: string[] }).permissions || [];
    const userId = (session.user as { id?: string }).id || '';

    if (!hasPermission(role, permissions, 'documents:upload')) {
      t('Forbidden — missing documents:upload permission');
      return NextResponse.json({ error: 'You do not have permission to upload documents.' }, { status: 403 });
    }
    t(`Auth OK — user: ${userId}, role: ${role}`);

    // ── Parse form data ───────────────────────────────────────────────────────
    t('Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawTitle = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const categoryId = (formData.get('category_id') as string | null) || undefined;
    const folderPath = (formData.get('folder_path') as string | null) || '/';
    const isPitch = formData.get('is_pitch') === 'true';

    if (!file) {
      t('Rejected — no file in form data');
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!rawTitle?.trim()) {
      t('Rejected — no title');
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    // Sanitize title/description — strip HTML, trim whitespace
    const title = rawTitle.trim().replace(/<[^>]*>/g, '').substring(0, 255);
    const safeDescription = description
      ? description.trim().replace(/<[^>]*>/g, '').substring(0, 2000)
      : undefined;

    t(`File received: "${file.name}", size: ${formatFileSize(file.size)}, type: "${file.type}"`);

    // ── Size pre-check (fail fast for files that are definitely too large) ─────
    const MAX_SIZE = 500 * 1024 * 1024; // 500 MB max
    if (file.size > MAX_SIZE) {
      t(`Rejected — file too large: ${formatFileSize(file.size)}`);
      return NextResponse.json(
        { error: `File too large (${formatFileSize(file.size)}). Max allowed: ${formatFileSize(MAX_SIZE)}.` },
        { status: 413 }
      );
    }

    // ── Resolve category slug ─────────────────────────────────────────────────
    let categorySlug = 'general';
    if (categoryId) {
      t(`Fetching category slug for ID: ${categoryId}`);
      try {
        const { getServiceClient } = await import('@/lib/supabase');
        const supabase = getServiceClient();
        const { data: category } = await supabase
          .from('document_categories')
          .select('slug')
          .eq('id', categoryId)
          .single();
        if (category?.slug) {
          categorySlug = category.slug;
          t(`Category: ${categorySlug}`);
        }
      } catch (err) {
        t(`Category lookup failed (non-fatal): ${(err as Error).message}`);
      }
    }

    // ── Upload to R2 using streaming for large files ──────────────────────────
    t(`Starting R2 upload — bucket: ${process.env.R2_BUCKET_NAME}, category: ${categorySlug}`);
    const uploadStart = Date.now();

    let url: string, key: string;
    try {
      // Use streaming upload for files > 10MB to reduce memory usage
      const STREAM_THRESHOLD = 10 * 1024 * 1024; // 10 MB
      
      if (file.size > STREAM_THRESHOLD) {
        t('Using streaming upload for large file...');
        ({ url, key } = await uploadStreamToR2(
          file.stream() as unknown as ReadableStream,
          file.name,
          file.type,
          file.size,
          categorySlug,
          folderPath
        ));
      } else {
        // For small files, use the buffer-based upload
        t('Reading file buffer for small file upload...');
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // ── Validate ──────────────────────────────────────────────────────────
        t('Validating file...');
        const validation = validateUpload(file.name, file.type, buffer, MAX_SIZE);
        if (!validation.valid) {
          t(`Validation failed: ${validation.error}`);
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        t('Validation OK');
        
        ({ url, key } = await uploadToR2(buffer, file.name, file.type, categorySlug, folderPath));
      }
    } catch (err) {
      const msg = (err as Error).message;
      t(`R2 upload FAILED after ${((Date.now() - uploadStart) / 1000).toFixed(1)}s: ${msg}`);
      // Surface a clear error to the client
      return NextResponse.json(
        { error: msg.includes('auth failed') || msg.includes('invalid') ? msg : `Upload to storage failed: ${msg}` },
        { status: 502 },
      );
    }

    t(`R2 upload OK in ${((Date.now() - uploadStart) / 1000).toFixed(1)}s — url: ${url}`);

    // ── Save to DB ────────────────────────────────────────────────────────────
    t('Saving document record to DB...');
    const metadata: Record<string, unknown> = {
      originalSize: file.size,
      uploadedAt: new Date().toISOString(),
      ...(file.type.startsWith('image/') && { type: 'image' }),
      ...(file.type.startsWith('video/') && { type: 'video' }),
      ...(file.type.startsWith('audio/') && { type: 'audio' }),
    };

    const document = await createDocument({
      title,
      description: safeDescription,
      file_name: file.name,
      file_url: url,
      file_key: key,
      file_size: file.size,
      file_type: file.type,
      category_id: categoryId,
      folder_path: folderPath,
      is_pitch_document: isPitch,
      metadata,
      uploaded_by: userId,
    });

    if (!document) {
      t('DB insert failed — document record not created');
      // File was uploaded but DB failed — log the orphan key
      console.error(`[upload:${reqId}] ORPHAN R2 key (DB failed): ${key}`);
      return NextResponse.json({ error: 'File uploaded but failed to save record. Contact admin.' }, { status: 500 });
    }

    t(`Done — document ID: ${document.id}`);
    return NextResponse.json(document, { status: 201 });

  } catch (error) {
    console.error(`[upload:${reqId}] Unhandled error:`, error);
    const message = error instanceof Error ? error.message : 'Unexpected error during upload.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
