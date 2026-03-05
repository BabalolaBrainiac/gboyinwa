import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const perms = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!session || !hasPermission(role ?? '', perms, 'events:edit')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const supabase = getServiceClient();
  const updates: Record<string, unknown> = {};
  const allowed = ['title', 'slug', 'description', 'summary', 'start_date', 'end_date', 'location', 'image_url', 'featured', 'published'];
  for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
  if (updates.slug && typeof updates.slug === 'string') {
    updates.slug = (updates.slug as string).toLowerCase().replace(/\s+/g, '-');
  }
  const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const perms = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!session || !hasPermission(role ?? '', perms, 'events:delete')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const supabase = getServiceClient();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
