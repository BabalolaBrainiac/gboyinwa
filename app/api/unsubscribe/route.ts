/**
 * Public Unsubscribe API
 * 
 * GET /api/unsubscribe?token=xxx - Unsubscribe page (redirects to confirmation)
 * POST /api/unsubscribe - Unsubscribe with token
 * Body: { token: string, reason?: string }
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    // Find subscriber by unsubscribe token
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('unsubscribe_token', token)
      .single();

    if (error || !subscriber) {
      return NextResponse.json({ error: 'invalid token' }, { status: 400 });
    }

    if (subscriber.status === 'unsubscribed') {
      return NextResponse.json({ 
        message: 'You are already unsubscribed.' 
      });
    }

    // Update status
    await supabase
      .from('subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    return NextResponse.json({
      message: 'You have been successfully unsubscribed.',
      success: true,
    });
  } catch (err: any) {
    console.error('Unsubscribe error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { token, reason } = body;

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    // Find subscriber by unsubscribe token
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('unsubscribe_token', token)
      .single();

    if (error || !subscriber) {
      return NextResponse.json({ error: 'invalid token' }, { status: 400 });
    }

    if (subscriber.status === 'unsubscribed') {
      return NextResponse.json({ 
        message: 'You are already unsubscribed.' 
      });
    }

    // Update status with reason
    const updates: Record<string, any> = {
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    };
    
    if (reason) {
      updates.unsubscribe_reason = reason;
    }

    await supabase
      .from('subscribers')
      .update(updates)
      .eq('id', subscriber.id);

    return NextResponse.json({
      message: 'You have been successfully unsubscribed.',
      success: true,
    });
  } catch (err: any) {
    console.error('Unsubscribe error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
