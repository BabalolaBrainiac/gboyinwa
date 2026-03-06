/**
 * Admin Subscribers API
 * 
 * GET /api/admin/subscribers - List all subscribers
 * GET /api/admin/subscribers?status=active - Filter by status
 * POST /api/admin/subscribers - Add a subscriber manually
 * PATCH /api/admin/subscribers/:id - Update subscriber
 * DELETE /api/admin/subscribers/:id - Delete subscriber
 * 
 * Permissions:
 * - subscribers:view - to list
 * - subscribers:manage - to create/update/delete
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';
import { hashEmail } from '@/lib/hash';
import { encryptPii } from '@/lib/encrypt';
import { randomBytes } from 'crypto';

// List subscribers
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!hasPermission(role, permissions, 'subscribers:view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const supabase = getServiceClient();

  try {
    let query = supabase
      .from('subscribers')
      .select('id, status, source, metadata, confirmed_at, unsubscribed_at, created_at, updated_at', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (source) {
      query = source === 'null' ? query.is('source', null) : query.eq('source', source);
    }

    // Search by email hash if provided
    if (search) {
      const emailHash = hashEmail(search.toLowerCase());
      query = query.eq('email_hash', emailHash);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Subscribers fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      subscribers: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (err: any) {
    console.error('Subscribers API error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// Create new subscriber
export async function POST(request: Request) {
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
  const { email, firstName, lastName, status = 'active', skipConfirmation = true } = body;

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const emailNorm = email.trim().toLowerCase();
  const emailHash = hashEmail(emailNorm);

  const supabase = getServiceClient();

  try {
    // Check if subscriber exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('email_hash', emailHash)
      .single();

    if (existing) {
      // Reactivate if unsubscribed
      if (existing.status === 'unsubscribed') {
        const { data: updated, error: updateError } = await supabase
          .from('subscribers')
          .update({
            status: 'active',
            unsubscribed_at: null,
            unsubscribe_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ 
          subscriber: updated, 
          message: 'subscriber reactivated' 
        }, { status: 200 });
      }

      return NextResponse.json({ error: 'subscriber already exists' }, { status: 409 });
    }

    // Encrypt email
    let emailEncrypted: string;
    try {
      emailEncrypted = encryptPii(emailNorm);
    } catch {
      return NextResponse.json({ error: 'encryption not configured' }, { status: 500 });
    }

    // Generate tokens
    const confirmationToken = skipConfirmation ? null : randomBytes(32).toString('hex');
    const unsubscribeToken = randomBytes(32).toString('hex');

    // Create subscriber
    const { data: subscriber, error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email_hash: emailHash,
        email_encrypted: emailEncrypted,
        first_name: firstName || null,
        last_name: lastName || null,
        status: skipConfirmation ? 'active' : 'pending',
        source: 'admin',
        metadata: { added_by: session.user?.email || 'admin' },
        confirmation_token: confirmationToken,
        confirmation_sent_at: skipConfirmation ? null : new Date().toISOString(),
        confirmed_at: skipConfirmation ? new Date().toISOString() : null,
        unsubscribe_token: unsubscribeToken,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Subscriber insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      subscriber, 
      message: skipConfirmation ? 'subscriber created' : 'confirmation required' 
    }, { status: 201 });
  } catch (err: any) {
    console.error('Subscriber creation error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
