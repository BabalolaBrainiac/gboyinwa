import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';
import { getSignedFileUrl } from '@/lib/r2';
import { convertDocumentToSlides, SlidePreviewMeta } from '@/lib/slide-converter';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — large file conversion can be slow

// ── GET — return signed URLs for already-converted slide images ───────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const supabase = getServiceClient();
    const { data: doc, error } = await supabase
      .from('documents')
      .select('metadata')
      .eq('id', id)
      .single();

    if (error || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const previews = doc.metadata?.slide_previews as SlidePreviewMeta | undefined;
    if (!previews?.keys?.length) {
      return NextResponse.json({ urls: [], slide_count: 0 });
    }

    const urls = await Promise.all(previews.keys.map(key => getSignedFileUrl(key, 3600)));
    return NextResponse.json({ urls, slide_count: previews.slide_count });
  } catch (err) {
    console.error('[slides:get]', err);
    return NextResponse.json({ error: 'Failed to load slides' }, { status: 500 });
  }
}

// ── POST — trigger slide conversion (idempotent) ──────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as { role?: string }).role || '';
    const permissions = (session.user as { permissions?: string[] }).permissions || [];
    if (!hasPermission(role, permissions, 'documents:present')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getServiceClient();
    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, file_key, file_name, file_type, file_size, metadata')
      .eq('id', id)
      .single();

    if (error || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // Idempotent — return cached result if slides already exist
    const existing = doc.metadata?.slide_previews as SlidePreviewMeta | undefined;
    if (existing?.keys?.length) {
      const urls = await Promise.all(existing.keys.map(k => getSignedFileUrl(k, 3600)));
      return NextResponse.json({ slide_previews: existing, urls });
    }

    // Run conversion
    const meta = await convertDocumentToSlides(doc.file_key, id, doc.file_name);

    // Persist slide metadata back into the document record
    const updatedMeta = { ...(doc.metadata ?? {}), slide_previews: meta };
    await supabase.from('documents').update({ metadata: updatedMeta }).eq('id', id);

    const urls = await Promise.all(meta.keys.map(k => getSignedFileUrl(k, 3600)));
    return NextResponse.json({ slide_previews: meta, urls });
  } catch (err) {
    console.error('[slides:post]', err);
    const message = err instanceof Error ? err.message : 'Conversion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
