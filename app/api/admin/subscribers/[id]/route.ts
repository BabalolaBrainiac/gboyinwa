/**
 * Individual Subscriber API
 * 
 * GET /api/admin/subscribers/:id - Get subscriber details
 * PATCH /api/admin/subscribers/:id - Update subscriber
 * DELETE /api/admin/subscribers/:id - Delete subscriber
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';

interface Params {
  params: { id: string };
}

// Get single subscriber
export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'subscribers:view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getServiceClient();

  try {
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'subscriber not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscriber });
  } catch (err: any) {
    console.error('Subscriber fetch error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// Update subscriber
export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'subscribers:manage')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { firstName, lastName, status, metadata } = body;

  const supabase = getServiceClient();

  try {
    const updates: Record<string, any> = {};
    
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'unsubscribed') {
        updates.unsubscribed_at = new Date().toISOString();
      }
    }
    if (metadata !== undefined) updates.metadata = metadata;

    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'subscriber not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscriber });
  } catch (err: any) {
    console.error('Subscriber update error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// Delete subscriber
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'subscribers:manage')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getServiceClient();

  try {
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Subscriber delete error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
