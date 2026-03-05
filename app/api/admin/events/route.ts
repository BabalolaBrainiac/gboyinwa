import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const perms = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!session || (role !== 'superadmin' && role !== 'admin')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const supabase = getServiceClient();
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const perms = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!session || !hasPermission(role ?? '', perms, 'events:create')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const { title, slug, description, summary, start_date, end_date, location, image_url, featured, published } = body;
  if (!title || !slug) return NextResponse.json({ error: 'title and slug required' }, { status: 400 });
  const supabase = getServiceClient();
  const userId = (session.user as { id?: string }).id;
  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      description: description ?? null,
      summary: summary ?? null,
      start_date: start_date || null,
      end_date: end_date || null,
      location: location ?? null,
      image_url: image_url ?? null,
      featured: Boolean(featured),
      published: published !== false,
      created_by: userId,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
