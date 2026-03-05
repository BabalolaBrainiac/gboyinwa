import { getServerSession } from 'next-auth';
import { authOptions, hasPermission, type Permission } from './auth';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== 'superadmin' && role !== 'admin') return null;
  return session;
}

export async function requirePermission(perm: Permission) {
  const session = await requireAdmin();
  if (!session) return null;
  const role = (session.user as { role?: string }).role;
  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  if (!hasPermission(role ?? '', permissions, perm)) return null;
  return session;
}

export async function requireSuperadmin() {
  const session = await requireAuth();
  if (!session) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== 'superadmin') return null;
  return session;
}
