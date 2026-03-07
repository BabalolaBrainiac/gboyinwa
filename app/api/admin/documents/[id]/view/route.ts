import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getSignedFileUrl } from '@/lib/r2';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ── In-memory caches (module-level, survives across requests within the same worker) ──
interface DocMeta { file_key: string; file_type: string; file_name: string; title: string }
interface CachedUrl { url: string; expiresAt: number }

const metaCache = new Map<string, { data: DocMeta; expiresAt: number }>();
const urlCache  = new Map<string, CachedUrl>();

const META_TTL = 10 * 60 * 1000;  // 10 min — doc metadata rarely changes
const URL_TTL  = 50 * 60 * 1000;  // 50 min — signed URL valid for 60 min

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role?: string }).role || '';
    const permissions = (session.user as { permissions?: string[] }).permissions || [];

    if (!hasPermission(role, permissions, 'documents:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const now = Date.now();

    // 1. Resolve doc metadata (cached)
    let doc: DocMeta | null = null;
    const cachedMeta = metaCache.get(id);
    if (cachedMeta && cachedMeta.expiresAt > now) {
      doc = cachedMeta.data;
    } else {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('documents')
        .select('file_key, file_type, file_name, title')
        .eq('id', id)
        .single();
      if (error || !data) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      doc = data;
      metaCache.set(id, { data: doc, expiresAt: now + META_TTL });
    }

    // 2. Resolve signed URL (cached)
    let signedUrl: string;
    const cachedUrl = urlCache.get(id);
    if (cachedUrl && cachedUrl.expiresAt > now) {
      signedUrl = cachedUrl.url;
    } else {
      signedUrl = await getSignedFileUrl(doc.file_key, 3600);
      urlCache.set(id, { url: signedUrl, expiresAt: now + URL_TTL });
    }

    return NextResponse.json({
      signedUrl,
      fileType: doc.file_type,
      fileName: doc.file_name,
      title: doc.title,
      expiresIn: 3600,
    }, {
      headers: { 'Cache-Control': 'private, max-age=2700' }, // browser can cache for 45 min
    });
  } catch (err) {
    console.error('[documents:view] error:', err);
    return NextResponse.json({ error: 'Failed to generate view URL' }, { status: 500 });
  }
}
