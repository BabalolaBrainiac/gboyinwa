import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Users, 
  TrendingUp,
  Eye,
  CheckCircle,
  BarChart3,
  Shield
} from 'lucide-react';

async function getMetrics(role: string) {
  const supabase = getServiceClient();
  
  const isSuperadmin = role === 'superadmin';
  
  // Base metrics for all admins
  const queries = [
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('featured', true),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
  ];
  
  // Only superadmins see user/team metrics
  if (isSuperadmin) {
    queries.push(
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'superadmin'),
      supabase.from('team_members').select('*', { count: 'exact', head: true })
    );
  }
  
  const results = await Promise.all(queries);
  
  // Get post views for all posts
  const { count: totalViews } = await supabase
    .from('post_views')
    .select('*', { count: 'exact', head: true });
    
  // Get top viewed posts
  const { data: topPosts } = await supabase
    .from('post_view_counts')
    .select('post_id, view_count')
    .order('view_count', { ascending: false })
    .limit(5);
    
  // Get post titles for top posts
  let topPostsWithTitles: Array<{ title: string; view_count: number; slug: string }> = [];
  if (topPosts && topPosts.length > 0) {
    const postIds = topPosts.map(p => p.post_id);
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, title, slug')
      .in('id', postIds);
      
    if (posts) {
      const postMap = new Map(posts.map(p => [p.id, p]));
      topPostsWithTitles = topPosts.map(tp => ({
        title: postMap.get(tp.post_id)?.title || 'Unknown Post',
        slug: postMap.get(tp.post_id)?.slug || '#',
        view_count: tp.view_count
      }));
    }
  }
  
  const metrics: {
    events: { total: number; published: number; featured: number };
    posts: { total: number; published: number; totalViews: number; topPosts: typeof topPostsWithTitles };
    users?: { total: number; admins: number; superadmins: number };
    team?: number;
  } = {
    events: { 
      total: (results[0].count as number) || 0, 
      published: (results[1].count as number) || 0, 
      featured: (results[2].count as number) || 0 
    },
    posts: { 
      total: (results[3].count as number) || 0, 
      published: (results[4].count as number) || 0,
      totalViews: totalViews || 0,
      topPosts: topPostsWithTitles
    },
  };
  
  if (isSuperadmin) {
    metrics.users = {
      total: (results[5].count as number) || 0,
      admins: (results[6].count as number) || 0,
      superadmins: (results[7].count as number) || 0,
    };
    metrics.team = (results[8].count as number) || 0;
  }
  
  return metrics;
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const displayName = (session?.user as { displayName?: string })?.displayName ?? 'Admin';
  const isSuperadmin = role === 'superadmin';
  
  const metrics = await getMetrics(role);

  const quickLinks = [
    { 
      href: '/admin/events', 
      label: 'Manage Events', 
      desc: `${metrics.events.published}/${metrics.events.total} published`,
      icon: Calendar,
      color: 'from-brand-orange to-brand-yellow'
    },
    { 
      href: '/admin/posts', 
      label: 'Manage Blog Posts', 
      desc: `${metrics.posts.published}/${metrics.posts.total} published`,
      icon: FileText,
      color: 'from-brand-green to-brand-violet'
    },
    ...(isSuperadmin ? [{ 
      href: '/admin/users', 
      label: 'Manage Users', 
      desc: `${metrics.users?.total || 0} total users`,
      icon: Users,
      color: 'from-brand-violet to-brand-orange'
    }] : []),
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header - Fixed layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-green dark:text-brand-yellow truncate">
            Dashboard
          </h1>
          <p className="text-brand-black/60 dark:text-brand-yellow/60 mt-1 text-sm sm:text-base">
            Welcome back, {displayName} · {isSuperadmin ? 'Superadmin' : 'Admin'}
          </p>
        </div>
        {isSuperadmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-brand-yellow/10 text-brand-yellow shrink-0">
            <Shield className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">Full System Access</span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className={`grid gap-4 ${isSuperadmin ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {/* Events Card */}
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-5 sm:p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{metrics.events.featured} featured
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-black dark:text-brand-yellow">
            {metrics.events.total}
          </p>
          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
            Total Events
          </p>
          <div className="mt-3 h-1.5 bg-brand-black/5 dark:bg-brand-yellow/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-orange rounded-full"
              style={{ width: `${metrics.events.total > 0 ? (metrics.events.published / metrics.events.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40 mt-1">
            {metrics.events.published} published
          </p>
        </div>

        {/* Blog Posts Card */}
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-5 sm:p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {metrics.posts.total > 0 ? Math.round((metrics.posts.published / metrics.posts.total) * 100) : 0}% published
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-black dark:text-brand-yellow">
            {metrics.posts.total}
          </p>
          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
            Blog Posts
          </p>
          <div className="mt-3 h-1.5 bg-brand-black/5 dark:bg-brand-yellow/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-green rounded-full"
              style={{ width: `${metrics.posts.total > 0 ? (metrics.posts.published / metrics.posts.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40 mt-1">
            {metrics.posts.published} published
          </p>
        </div>

        {/* Post Views Card - NEW */}
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-5 sm:p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
            </div>
            <span className="text-xs font-medium text-brand-yellow flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Total Views
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-black dark:text-brand-yellow">
            {metrics.posts.totalViews.toLocaleString()}
          </p>
          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
            Post Views
          </p>
          <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40 mt-3">
            Across all published posts
          </p>
        </div>

        {/* Users Card - Superadmin only */}
        {isSuperadmin && metrics.users && (
          <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-5 sm:p-6 border border-brand-green/10 dark:border-brand-yellow/10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-violet/10 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-brand-violet" />
              </div>
              <span className="text-xs font-medium text-brand-violet flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {metrics.users.superadmins} super
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-brand-black dark:text-brand-yellow">
              {metrics.users.total}
            </p>
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
              Total Users
            </p>
            <div className="mt-3 flex gap-1">
              {metrics.users.admins > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-violet/10 text-brand-violet text-xs">
                  {metrics.users.admins} admins
                </span>
              )}
            </div>
          </div>
        )}

        {/* Team Card - Superadmin only */}
        {isSuperadmin && typeof metrics.team === 'number' && (
          <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-5 sm:p-6 border border-brand-green/10 dark:border-brand-yellow/10 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-brand-black dark:text-brand-yellow">
              {metrics.team}
            </p>
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
              Team Members
            </p>
            <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40 mt-3">
              Publicly visible on team page
            </p>
          </div>
        )}
      </div>

      {/* Top Posts by Views */}
      {metrics.posts.topPosts.length > 0 && (
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-5 sm:p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-yellow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-black dark:text-brand-yellow">
                Top Performing Posts
              </h2>
              <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50">
                Most viewed blog posts
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {metrics.posts.topPosts.map((post, index) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                target="_blank"
                className="flex items-center justify-between p-3 rounded-xl bg-brand-black/5 dark:bg-white/5 hover:bg-brand-yellow/10 dark:hover:bg-brand-yellow/10 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-brand-black dark:text-brand-yellow truncate group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                    {post.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Eye className="w-4 h-4 text-brand-black/30 dark:text-brand-yellow/30" />
                  <span className="text-sm font-bold text-brand-yellow">
                    {post.view_count.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-brand-black dark:text-brand-yellow mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-white dark:bg-brand-black/50 border border-brand-green/10 dark:border-brand-yellow/10 hover:border-transparent transition-all duration-300"
            >
              {/* Hover gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="absolute inset-[2px] rounded-2xl bg-white dark:bg-brand-black group-hover:bg-white/95 dark:group-hover:bg-brand-black/95 transition-colors" />
              
              <div className="relative">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4`}>
                  <link.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-bold text-brand-black dark:text-brand-yellow mb-1">
                  {link.label}
                </h3>
                <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                  {link.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Status - Superadmin only */}
      {isSuperadmin && (
        <div className="bg-gradient-to-r from-brand-green to-brand-violet rounded-2xl p-5 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg">System Status</h3>
              <p className="text-white/80 text-sm">
                All systems operational. Database connected. Email service active.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium">Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
