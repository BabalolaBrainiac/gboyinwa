import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminMeetingsClient } from './admin-meetings-client';
import type { Permission } from '@/lib/permissions';

export default async function AdminMeetingsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  if (!session) {
    redirect('/login?callbackUrl=/admin/meetings');
  }

  // Check if user has any meeting permissions
  const canViewMeetings = hasPermission(role, permissions, 'meetings:view');
  const canCreateMeetings = hasPermission(role, permissions, 'meetings:create');
  const canEditMeetings = hasPermission(role, permissions, 'meetings:edit');
  const canDeleteMeetings = hasPermission(role, permissions, 'meetings:delete');
  const canSendInvites = hasPermission(role, permissions, 'meetings:send_invites');

  if (!canViewMeetings) {
    redirect('/admin');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-6">Meetings</h1>
      <AdminMeetingsClient
        permissions={{
          canCreate: canCreateMeetings,
          canEdit: canEditMeetings,
          canDelete: canDeleteMeetings,
          canSendInvites: canSendInvites,
        }}
      />
    </div>
  );
}
