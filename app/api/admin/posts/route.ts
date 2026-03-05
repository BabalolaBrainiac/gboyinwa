import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== 'superadmin' && role !== 'admin')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const perms = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!session || !hasPermission(role ?? '', perms, 'posts:create')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const { title, slug, excerpt, body: postBody, cover_url, published } = body;
  if (!title || !slug || postBody === undefined) {
    return NextResponse.json({ error: 'title, slug and body required' }, { status: 400 });
  }
  const supabase = getServiceClient();
  const authorId = (session.user as { id?: string }).id;
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      excerpt: excerpt ?? null,
      body: postBody,
      cover_url: cover_url ?? null,
      published: Boolean(published),
      published_at: published ? new Date().toISOString() : null,
      author_id: authorId,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
