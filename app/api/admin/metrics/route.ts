/**
 * Admin Metrics API
 * 
 * GET /api/admin/metrics - Get dashboard metrics
 * GET /api/admin/metrics?type=blog - Get blog-specific metrics
 * GET /api/admin/metrics?type=subscribers - Get subscriber metrics
 * GET /api/admin/metrics?type=campaigns - Get campaign metrics
 * 
 * Required permission: metrics:view_dashboard (or specific metric permission)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, canViewDashboard, canViewSubscribers, canManageCampaigns, type Permission } from '@/lib/permissions';
import { getServiceClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  // Check basic auth
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const days = parseInt(searchParams.get('days') || '30', 10);

  const supabase = getServiceClient();

  try {
    switch (type) {
      case 'dashboard': {
        if (!canViewDashboard(role, permissions)) {
          return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        // Get dashboard summary using the database function
        const { data: metrics, error: metricsError } = await supabase.rpc('get_dashboard_metrics');
        
        if (metricsError) {
          console.error('Metrics error:', metricsError);
          return NextResponse.json({ error: 'failed to fetch metrics' }, { status: 500 });
        }

        // Get recent subscriber growth
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { data: growth, error: growthError } = await supabase.rpc('get_subscriber_growth', {
          start_date: startDate,
          end_date: endDate,
        });

        return NextResponse.json({
          metrics: metrics?.[0] || null,
          growth: growth || [],
          period: { start: startDate, end: endDate, days },
        });
      }

      case 'blog': {
        if (!hasPermission(role, permissions, 'metrics:view_blog')) {
          return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        // Get blog post metrics
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('id, title, slug, published, published_at, created_at')
          .order('created_at', { ascending: false });

        if (postsError) {
          return NextResponse.json({ error: postsError.message }, { status: 500 });
        }

        const { data: notifications, error: notifError } = await supabase
          .from('blog_post_notifications')
          .select('*');

        return NextResponse.json({
          posts: posts || [],
          notifications: notifications || [],
          summary: {
            total: posts?.length || 0,
            published: posts?.filter(p => p.published).length || 0,
            drafts: posts?.filter(p => !p.published).length || 0,
            with_notifications: notifications?.length || 0,
          },
        });
      }

      case 'subscribers': {
        if (!canViewSubscribers(role, permissions)) {
          return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        // Get subscriber stats
        const { data: stats, error: statsError } = await supabase
          .from('v_subscriber_stats')
          .select('*')
          .single();

        if (statsError) {
          return NextResponse.json({ error: statsError.message }, { status: 500 });
        }

        // Get growth data
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { data: growth } = await supabase.rpc('get_subscriber_growth', {
          start_date: startDate,
          end_date: endDate,
        });

        return NextResponse.json({
          stats,
          growth: growth || [],
          period: { start: startDate, end: endDate, days },
        });
      }

      case 'campaigns': {
        if (!canManageCampaigns(role, permissions)) {
          return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        // Get campaign stats using the view
        const { data: campaigns, error: campaignsError } = await supabase
          .from('v_campaign_stats')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (campaignsError) {
          return NextResponse.json({ error: campaignsError.message }, { status: 500 });
        }

        // Aggregate metrics
        const totals = campaigns?.reduce((acc, c) => ({
          total_recipients: acc.total_recipients + (c.total_recipients || 0),
          total_delivered: acc.total_delivered + (c.delivered_count || 0),
          total_opened: acc.total_opened + (c.opened_count || 0),
          total_clicked: acc.total_clicked + (c.clicked_count || 0),
        }), { total_recipients: 0, total_delivered: 0, total_opened: 0, total_clicked: 0 });

        return NextResponse.json({
          campaigns: campaigns || [],
          totals,
          avg_open_rate: campaigns?.length 
            ? campaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) / campaigns.filter(c => c.open_rate > 0).length 
            : 0,
          avg_click_rate: campaigns?.length 
            ? campaigns.reduce((sum, c) => sum + (c.click_rate || 0), 0) / campaigns.filter(c => c.click_rate > 0).length 
            : 0,
        });
      }

      default:
        return NextResponse.json({ error: 'invalid metric type' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Metrics API error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
