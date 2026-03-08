import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { createDocument } from '@/lib/documents';
import { r2KeyToPublicUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as { role?: string }).role || '';
  const permissions = (session.user as { permissions?: string[] }).permissions || [];
  const userId = (session.user as { id?: string }).id || '';

  if (!hasPermission(role, permissions, 'documents:upload')) {
    return NextResponse.json({ error: 'You do not have permission to upload documents.' }, { status: 403 });
  }

  const {
    key,
    title: rawTitle,
    description,
    file_name,
    file_type,
    file_size,
    category_id,
    folder_path,
    is_pitch,
  } = await request.json();

  if (!key || !rawTitle?.trim() || !file_name) {
    return NextResponse.json({ error: 'key, title, and file_name are required.' }, { status: 400 });
  }

  const title = rawTitle.trim().replace(/<[^>]*>/g, '').substring(0, 255);
  const safeDescription = description
    ? description.trim().replace(/<[^>]*>/g, '').substring(0, 2000)
    : undefined;

  const url = r2KeyToPublicUrl(key);

  const metadata: Record<string, unknown> = {
    originalSize: file_size,
    uploadedAt: new Date().toISOString(),
    ...(file_type?.startsWith('image/') && { type: 'image' }),
    ...(file_type?.startsWith('video/') && { type: 'video' }),
    ...(file_type?.startsWith('audio/') && { type: 'audio' }),
  };

  const document = await createDocument({
    title,
    description: safeDescription,
    file_name,
    file_url: url,
    file_key: key,
    file_size,
    file_type,
    category_id,
    folder_path: folder_path || '/',
    is_pitch_document: is_pitch === true,
    metadata,
    uploaded_by: userId,
  });

  if (!document) {
    console.error(`[complete] ORPHAN R2 key (DB failed): ${key}`);
    return NextResponse.json({ error: 'File uploaded but failed to save record. Contact admin.' }, { status: 500 });
  }

  return NextResponse.json(document, { status: 201 });
}
