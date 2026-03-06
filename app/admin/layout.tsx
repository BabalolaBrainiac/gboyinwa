import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import Link from 'next/link';
import { Header } from '@/components/header';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Users, 
  Shield,
  AlertCircle,
  Mail,
  UsersRound,
  Megaphone,
  BarChart3,
  type LucideIcon
} from 'lucide-react';
import { 
  canViewCommunications, 
  canViewSubscribers, 
  canManageCampaigns,
  canViewDashboard,
  type Permission 
} from '@/lib/permissions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  
  const role = (session.user as { role?: string }).role;
  const permissions = ((session.user as { permissions?: string[] }).permissions ?? []) as Permission[];
  
  // Only allow admins and superadmins
  if (role !== 'superadmin' && role !== 'admin') redirect('/');
  
  const isSuperadmin = role === 'superadmin';
  
  // Check specific permissions for admins
  const canManageEvents = isSuperadmin || hasPermission(role, permissions, 'events:create') || hasPermission(role, permissions, 'events:edit') || hasPermission(role, permissions, 'events:delete');
  const canManagePosts = isSuperadmin || hasPermission(role, permissions, 'posts:create') || hasPermission(role, permissions, 'posts:edit') || hasPermission(role, permissions, 'posts:delete');
  const canManageUsers = isSuperadmin; // Only superadmins can manage users
  const canViewComms = canViewCommunications(role, permissions);
  const canViewSubs = canViewSubscribers(role, permissions);
  const canViewCamps = canManageCampaigns(role, permissions);
  const canViewMetricsDash = canViewDashboard(role, permissions);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 flex pt-24">
        <aside className="w-64 border-r border-brand-green/10 dark:border-brand-yellow/10 p-4 shrink-0 bg-white/50 dark:bg-brand-black/30 min-h-[calc(100vh-6rem)]">
          <div className="mb-6 px-3">
            <div className="flex items-center gap-2 text-brand-green dark:text-brand-yellow">
              {isSuperadmin ? (
                <>
                  <Shield className="w-5 h-5" />
                  <span className="font-bold">Superadmin</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-bold">Admin</span>
                </>
              )}
            </div>
            <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 mt-1">
              {isSuperadmin ? 'Full system access' : 'Content management only'}
            </p>
          </div>
          
          <nav className="space-y-1">
            {/* Dashboard - visible to all admins */}
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            
            {/* Events - visible to those with event permissions */}
            {canManageEvents && (
              <Link
                href="/admin/events"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Events
              </Link>
            )}
            
            {/* Blog Posts - visible to those with post permissions */}
            {canManagePosts && (
              <Link
                href="/admin/posts"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                <FileText className="w-4 h-4" />
                Blog Posts
              </Link>
            )}
            
            {/* Users - visible only to superadmins */}
            {canManageUsers && (
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                <Users className="w-4 h-4" />
                Users
              </Link>
            )}
            
            {/* Subscribers - visible to those with subscriber permissions */}
            {canViewSubs && (
              <Link
                href="/admin/subscribers"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                <UsersRound className="w-4 h-4" />
                Subscribers
              </Link>
            )}
            
            {/* Campaigns - visible to those with campaign permissions */}
            {canViewCamps && (
              <Link
                href="/admin/campaigns"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                <Megaphone className="w-4 h-4" />
                Campaigns
              </Link>
            )}
            
            {/* Communications - visible to those with communication permissions */}
            {canViewComms && (
              <Link
                href="/admin/communications"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                <Mail className="w-4 h-4" />
                Communications
              </Link>
            )}
            
            {/* Analytics - visible to those with metrics permissions */}
            {canViewMetricsDash && (
              <Link
                href="/admin/analytics"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
            )}
          </nav>
          
          {/* Permission notice for limited admins */}
          {!isSuperadmin && (!canManageEvents || !canManagePosts) && (
            <div className="mt-6 p-3 rounded-lg bg-brand-yellow/5 border border-brand-yellow/10">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                <p className="text-xs text-brand-black/60 dark:text-brand-yellow/60">
                  Your permissions are limited. Contact a superadmin for additional access.
                </p>
              </div>
            </div>
          )}
          
          {/* Back to site link */}
          <div className="mt-6 pt-6 border-t border-brand-green/10 dark:border-brand-yellow/10">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-brand-black/50 dark:text-brand-yellow/50 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
            >
              ← Back to website
            </Link>
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
