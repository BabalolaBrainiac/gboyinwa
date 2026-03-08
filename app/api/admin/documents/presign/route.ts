import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { buildR2Key, getPresignedPutUrl, r2KeyToPublicUrl, ALLOWED_MIME_TYPES } from '@/lib/r2';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as { role?: string }).role || '';
  const permissions = (session.user as { permissions?: string[] }).permissions || [];

  if (!hasPermission(role, permissions, 'documents:upload')) {
    return NextResponse.json({ error: 'You do not have permission to upload documents.' }, { status: 403 });
  }

  const { fileName, contentType, fileSize, categoryId, folderPath } = await request.json();

  if (!fileName || !contentType) {
    return NextResponse.json({ error: 'fileName and contentType are required.' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES[contentType]) {
    return NextResponse.json({ error: `File type "${contentType}" is not allowed.` }, { status: 400 });
  }

  const MAX_SIZE = 500 * 1024 * 1024;
  if (fileSize && fileSize > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 500 MB limit.' }, { status: 413 });
  }

  // Resolve category slug
  let categorySlug = 'general';
  if (categoryId) {
    try {
      const supabase = getServiceClient();
      const { data: category } = await supabase
        .from('document_categories')
        .select('slug')
        .eq('id', categoryId)
        .single();
      if (category?.slug) categorySlug = category.slug;
    } catch {}
  }

  const key = buildR2Key(fileName, categorySlug, folderPath || '/');
  const uploadUrl = await getPresignedPutUrl(key, contentType);
  const publicUrl = r2KeyToPublicUrl(key);

  return NextResponse.json({ uploadUrl, key, publicUrl });
}
