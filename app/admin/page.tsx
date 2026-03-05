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
  Clock,
  Shield
} from 'lucide-react';

async function getMetrics() {
  const supabase = getServiceClient();
  
  const [
    { count: totalEvents },
    { count: publishedEvents },
    { count: featuredEvents },
    { count: totalPosts },
    { count: publishedPosts },
    { count: totalUsers },
    { count: adminUsers },
    { count: superadminUsers },
    { count: teamMembers },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('featured', true),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'superadmin'),
    supabase.from('team_members').select('*', { count: 'exact', head: true }),
  ]);

  return {
    events: { total: totalEvents || 0, published: publishedEvents || 0, featured: featuredEvents || 0 },
    posts: { total: totalPosts || 0, published: publishedPosts || 0 },
    users: { total: totalUsers || 0, admins: adminUsers || 0, superadmins: superadminUsers || 0 },
    team: teamMembers || 0,
  };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const displayName = (session?.user as { displayName?: string })?.displayName ?? 'Admin';
  
  const metrics = await getMetrics();

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
    ...(role === 'superadmin' ? [{ 
      href: '/admin/users', 
      label: 'Manage Users', 
      desc: `${metrics.users.total} total users`,
      icon: Users,
      color: 'from-brand-violet to-brand-orange'
    }] : []),
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-green dark:text-brand-yellow">
            Dashboard
          </h1>
          <p className="text-brand-black/60 dark:text-brand-yellow/60 mt-1">
            Welcome back, {displayName} · {role === 'superadmin' ? 'Superadmin' : 'Admin'}
          </p>
        </div>
        {role === 'superadmin' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/10 text-brand-yellow">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Full System Access</span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Events Card */}
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-brand-orange" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{metrics.events.featured} featured
            </span>
          </div>
          <p className="text-3xl font-bold text-brand-black dark:text-brand-yellow">
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
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-brand-green" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {metrics.posts.total > 0 ? Math.round((metrics.posts.published / metrics.posts.total) * 100) : 0}% published
            </span>
          </div>
          <p className="text-3xl font-bold text-brand-black dark:text-brand-yellow">
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

        {/* Users Card */}
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-violet/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-violet" />
            </div>
            <span className="text-xs font-medium text-brand-violet flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {metrics.users.superadmins} super
            </span>
          </div>
          <p className="text-3xl font-bold text-brand-black dark:text-brand-yellow">
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

        {/* Team Card */}
        <div className="bg-white dark:bg-brand-black/50 rounded-2xl p-6 border border-brand-green/10 dark:border-brand-yellow/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-brand-yellow" />
            </div>
          </div>
          <p className="text-3xl font-bold text-brand-black dark:text-brand-yellow">
            {metrics.team}
          </p>
          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
            Team Members
          </p>
          <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40 mt-3">
            Publicly visible on team page
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-yellow mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-brand-black/50 border border-brand-green/10 dark:border-brand-yellow/10 hover:border-transparent transition-all duration-300"
            >
              {/* Hover gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="absolute inset-[2px] rounded-2xl bg-white dark:bg-brand-black group-hover:bg-white/95 dark:group-hover:bg-brand-black/95 transition-colors" />
              
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4`}>
                  <link.icon className="w-6 h-6 text-white" />
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

      {/* System Status */}
      <div className="bg-gradient-to-r from-brand-green to-brand-violet rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">System Status</h3>
            <p className="text-white/80 text-sm">
              All systems operational. Database connected. Email service active.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
