import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import Link from 'next/link';
import { Header } from '@/components/header';
import { getServiceClient } from '@/lib/supabase';
import Image from 'next/image';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Shield,
  Mail,
  UsersRound,
  Megaphone,
  BarChart3,
  FolderOpen,
  UserCircle,
} from 'lucide-react';
import { 
  canViewCommunications, 
  canViewSubscribers, 
  canManageCampaigns,
  canViewDashboard,
  type Permission 
} from '@/lib/permissions';
import { SidebarNavItem } from '@/components/admin/sidebar-nav-item';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  
  const role = (session.user as { role?: string }).role;
  const permissions = ((session.user as { permissions?: string[] }).permissions ?? []) as Permission[];
  const userId = (session.user as { id?: string }).id;
  const sessionDisplayName = (session.user as { displayName?: string }).displayName || '';

  // Only allow admins and superadmins
  if (role !== 'superadmin' && role !== 'admin') redirect('/');

  // Fetch fresh profile (avatar + latest display name)
  let avatarUrl: string | null = null;
  let displayName = sessionDisplayName;
  if (userId) {
    const supabase = getServiceClient();
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();
    if (profile) {
      displayName = profile.display_name || sessionDisplayName;
      avatarUrl = profile.avatar_url || null;
    }
  }

  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : (role === 'superadmin' ? 'SA' : 'AD');
  
  const isSuperadmin = role === 'superadmin';
  
  // Check specific permissions for admins
  const canManageEvents = isSuperadmin || hasPermission(role, permissions, 'events:create') || hasPermission(role, permissions, 'events:edit') || hasPermission(role, permissions, 'events:delete');
  const canManagePosts = isSuperadmin || hasPermission(role, permissions, 'posts:create') || hasPermission(role, permissions, 'posts:edit') || hasPermission(role, permissions, 'posts:delete');
  const canManageUsers = isSuperadmin; // Only superadmins can manage users
  const canViewComms = canViewCommunications(role, permissions);
  const canViewSubs = canViewSubscribers(role, permissions);
  const canViewCamps = canManageCampaigns(role, permissions);
  const canViewMetricsDash = canViewDashboard(role, permissions);
  const canViewDocs = hasPermission(role, permissions, 'documents:view');
  const canViewAudit = hasPermission(role, permissions, 'audit:view');
  
  // All permission checks in one object for the sidebar
  const permissionsMap = {
    events: canManageEvents,
    posts: canManagePosts,
    users: canManageUsers,
    subscribers: canViewSubs,
    campaigns: canViewCamps,
    communications: canViewComms,
    analytics: canViewMetricsDash,
    documents: canViewDocs,
    audit: canViewAudit,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 flex pt-24">
        <aside className="w-64 border-r border-brand-green/10 dark:border-brand-yellow/10 p-4 shrink-0 bg-white/50 dark:bg-brand-black/30 min-h-[calc(100vh-6rem)]">
          {/* User profile area */}
          <div className="mb-6 px-3">
            <Link href="/admin/profile" className="flex items-center gap-3 group mb-3 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center shrink-0 border border-brand-green/20 dark:border-brand-yellow/20 relative">
                {avatarUrl ? (
                  <Image 
                    src={avatarUrl} 
                    alt={displayName} 
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                ) : (
                  <span className="text-sm font-bold text-brand-green dark:text-brand-yellow">{initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-brand-black dark:text-brand-yellow text-sm truncate">
                  {displayName || 'Admin'}
                </p>
                <div className="flex items-center gap-1">
                  {isSuperadmin ? (
                    <Shield className="w-3 h-3 text-brand-yellow" />
                  ) : (
                    <UserCircle className="w-3 h-3 text-brand-green dark:text-brand-yellow/60" />
                  )}
                  <span className="text-xs text-brand-black/50 dark:text-brand-yellow/50 capitalize">{role}</span>
                </div>
              </div>
            </Link>
            <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40">
              {isSuperadmin ? 'Full system access' : 'Admin'}
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
            
            {/* Events - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/events" 
              icon={<Calendar className="w-4 h-4" />}
              label="Events"
              allowed={permissionsMap.events}
            />
            
            {/* Blog Posts - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/posts" 
              icon={<FileText className="w-4 h-4" />}
              label="Blog Posts"
              allowed={permissionsMap.posts}
            />
            
            {/* Users - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/users" 
              icon={<Users className="w-4 h-4" />}
              label="Users"
              allowed={permissionsMap.users}
            />
            
            {/* Subscribers - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/subscribers" 
              icon={<UsersRound className="w-4 h-4" />}
              label="Subscribers"
              allowed={permissionsMap.subscribers}
            />
            
            {/* Campaigns - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/campaigns" 
              icon={<Megaphone className="w-4 h-4" />}
              label="Campaigns"
              allowed={permissionsMap.campaigns}
            />
            
            {/* Communications - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/communications" 
              icon={<Mail className="w-4 h-4" />}
              label="Communications"
              allowed={permissionsMap.communications}
            />
            
            {/* Analytics - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/analytics" 
              icon={<BarChart3 className="w-4 h-4" />}
              label="Analytics"
              allowed={permissionsMap.analytics}
            />
            
            {/* Documents - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/documents" 
              icon={<FolderOpen className="w-4 h-4" />}
              label="Documents"
              allowed={permissionsMap.documents}
            />
            
            {/* Audit Logs - shows lock icon if no permission */}
            <SidebarNavItem 
              href="/admin/audit-logs" 
              icon={<Shield className="w-4 h-4" />}
              label="Audit Logs"
              allowed={permissionsMap.audit}
            />
          </nav>
          
          {/* Back to site + Profile */}
          <div className="mt-6 pt-6 border-t border-brand-green/10 dark:border-brand-yellow/10 space-y-1">
            <Link
              href="/admin/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-brand-black/60 dark:text-brand-yellow/60 hover:text-brand-green dark:hover:text-brand-yellow hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 rounded-lg transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              Edit Profile
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-brand-black/50 dark:text-brand-yellow/50 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
            >
              ← Back to website
            </Link>
          </div>
        </aside>
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
