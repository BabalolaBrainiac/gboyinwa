'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Mail, FileText, Calendar, Loader2, Megaphone, Eye, MousePointer } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission, type Permission } from '@/lib/permissions';
import { CustomSelect } from '@/components/ui/custom-select';

interface DashboardMetrics {
  total_subscribers: number;
  active_subscribers: number;
  new_subscribers_today: number;
  total_posts: number;
  total_campaigns: number;
  emails_sent_this_month: number;
  avg_open_rate: number;
  avg_click_rate: number;
}

interface GrowthData {
  date: string;
  new_subscribers: number;
  unsubscribes: number;
  net_growth: number;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  const canViewSubs = hasPermission(role, permissions, 'metrics:view_subscribers');
  const canViewBlog = hasPermission(role, permissions, 'metrics:view_blog');
  const canViewCamps = hasPermission(role, permissions, 'metrics:view_campaigns');

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [growth, setGrowth] = useState<GrowthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchMetrics();
  }, [days]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/metrics?type=dashboard&days=${days}`);
      const data = await res.json();
      
      if (res.ok) {
        setMetrics(data.metrics || null);
        setGrowth(data.growth || []);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subtext, 
    color = 'green' 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    subtext?: string;
    color?: 'green' | 'blue' | 'purple' | 'orange';
  }) => {
    const colorClasses = {
      green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    };

    return (
      <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">{label}</p>
            <p className="text-3xl font-bold text-brand-black dark:text-brand-yellow mt-1">{value}</p>
            {subtext && <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50 mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green dark:text-brand-yellow" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-black dark:text-brand-yellow flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            Analytics Dashboard
          </h1>
          <p className="text-brand-black/60 dark:text-brand-yellow/60 mt-1">
            Overview of your website metrics and performance
          </p>
        </div>
        <CustomSelect
          value={String(days)}
          onChange={(value) => setDays(Number(value))}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
          ]}
          className="w-40"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {canViewSubs && (
          <>
            <StatCard
              icon={Users}
              label="Total Subscribers"
              value={metrics?.total_subscribers?.toLocaleString() || '0'}
              subtext={`${metrics?.active_subscribers?.toLocaleString() || '0'} active`}
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              label="New Today"
              value={metrics?.new_subscribers_today || 0}
              subtext="Subscribers joined today"
              color="blue"
            />
          </>
        )}
        {canViewBlog && (
          <StatCard
            icon={FileText}
            label="Published Posts"
            value={metrics?.total_posts || 0}
            subtext="Total blog posts"
            color="purple"
          />
        )}
        {canViewCamps && (
          <StatCard
            icon={Mail}
            label="Emails This Month"
            value={metrics?.emails_sent_this_month?.toLocaleString() || '0'}
            subtext="Across all campaigns"
            color="orange"
          />
        )}
      </div>

      {/* Campaign Performance */}
      {canViewCamps && metrics && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-yellow mb-4">Campaign Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Total Campaigns</span>
              </div>
              <p className="text-2xl font-bold text-brand-black dark:text-brand-yellow">{metrics?.total_campaigns || 0}</p>
              <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40 mt-1">All time campaigns</p>
            </div>
            <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Avg Open Rate</span>
              </div>
              <p className="text-2xl font-bold text-brand-black dark:text-brand-yellow">{metrics?.avg_open_rate?.toFixed(1) || '0.0'}%</p>
              <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40 mt-1">Industry avg: 21%</p>
            </div>
            <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <MousePointer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Avg Click Rate</span>
              </div>
              <p className="text-2xl font-bold text-brand-black dark:text-brand-yellow">{metrics?.avg_click_rate?.toFixed(1) || '0.0'}%</p>
              <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40 mt-1">Industry avg: 2.5%</p>
            </div>
          </div>
        </div>
      )}

      {/* Engagement metrics */}
      {canViewCamps && metrics && (metrics.avg_open_rate > 0 || metrics.avg_click_rate > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-yellow mb-4">Campaign Engagement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
              <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Average Open Rate</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-bold text-brand-black dark:text-brand-yellow">
                  {metrics.avg_open_rate?.toFixed(1) || '0.0'}%
                </span>
                <span className="text-sm text-green-600 mb-1">Industry avg: 21%</span>
              </div>
              <div className="mt-3 h-2 bg-brand-green/10 dark:bg-brand-yellow/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-green dark:bg-brand-yellow rounded-full"
                  style={{ width: `${Math.min(metrics.avg_open_rate || 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
              <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Average Click Rate</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-bold text-brand-black dark:text-brand-yellow">
                  {metrics.avg_click_rate?.toFixed(1) || '0.0'}%
                </span>
                <span className="text-sm text-green-600 mb-1">Industry avg: 2.5%</span>
              </div>
              <div className="mt-3 h-2 bg-brand-green/10 dark:bg-brand-yellow/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-green dark:bg-brand-yellow rounded-full"
                  style={{ width: `${Math.min((metrics.avg_click_rate || 0) * 4, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Growth chart placeholder */}
      {canViewSubs && growth.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-yellow mb-4">Subscriber Growth</h2>
          <div className="bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
            <div className="h-64 flex items-end gap-2">
              {growth.map((day, i) => {
                const maxGrowth = Math.max(...growth.map(g => Math.max(g.new_subscribers, Math.abs(g.unsubscribes))), 1);
                const height = maxGrowth > 0 ? (day.new_subscribers / maxGrowth) * 100 : 0;
                const unsubHeight = maxGrowth > 0 ? (Math.abs(day.unsubscribes) / maxGrowth) * 100 : 0;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex flex-col items-center gap-0.5">
                      {day.new_subscribers > 0 && (
                        <div 
                          className="w-full bg-brand-green/60 dark:bg-brand-yellow/60 rounded-t transition-all group-hover:bg-brand-green dark:group-hover:bg-brand-yellow"
                          style={{ height: `${height}%` }}
                          title={`+${day.new_subscribers} subscribers`}
                        />
                      )}
                      {day.unsubscribes > 0 && (
                        <div 
                          className="w-full bg-red-400 rounded-b transition-all"
                          style={{ height: `${unsubHeight}%` }}
                          title={`-${day.unsubscribes} unsubscribes`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-brand-black/40 dark:text-brand-yellow/40 rotate-45 origin-left translate-y-2">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-brand-green/60 dark:bg-brand-yellow/60 rounded" />
                <span className="text-brand-black/60 dark:text-brand-yellow/60">New Subscribers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span className="text-brand-black/60 dark:text-brand-yellow/60">Unsubscribes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canViewSubs && (
          <a 
            href="/admin/subscribers"
            className="flex items-center gap-4 p-4 bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 hover:border-brand-green/30 dark:hover:border-brand-yellow/30 transition-colors"
          >
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-brand-black dark:text-brand-yellow">Manage Subscribers</p>
              <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">View and edit your subscriber list</p>
            </div>
          </a>
        )}
        {canViewCamps && (
          <a 
            href="/admin/campaigns"
            className="flex items-center gap-4 p-4 bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 hover:border-brand-green/30 dark:hover:border-brand-yellow/30 transition-colors"
          >
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-brand-black dark:text-brand-yellow">Email Campaigns</p>
              <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">Create and manage campaigns</p>
            </div>
          </a>
        )}
        {canViewBlog && (
          <a 
            href="/admin/posts"
            className="flex items-center gap-4 p-4 bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 hover:border-brand-green/30 dark:hover:border-brand-yellow/30 transition-colors"
          >
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-brand-black dark:text-brand-yellow">Blog Posts</p>
              <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">Manage your content</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
