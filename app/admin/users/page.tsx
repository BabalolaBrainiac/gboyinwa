import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminUsersClient } from './admin-users-client';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'superadmin') return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-6">Users</h1>
      <AdminUsersClient />
    </div>
  );
}
