import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServiceClient } from './supabase';
import { hashEmail } from './hash';
import { verifyPassword } from './password';

const ADMIN_DOMAIN = 'gboyinwa.com';

export function isAdminEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { label: 'Email' }, password: { label: 'Password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const supabase = getServiceClient();
        const emailHash = hashEmail(credentials.email);
        const { data: user, error } = await supabase
          .from('users')
          .select('id, password_hash, role, display_name')
          .eq('email_hash', emailHash)
          .single();
        if (error || !user?.password_hash) return null;
        
        // Use Web Crypto API for password verification (works on Edge)
        const ok = await verifyPassword(credentials.password, user.password_hash);
        if (!ok) return null;
        
        const { data: perms } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', user.id);
        const permissions = (perms ?? []).map((p) => p.permission);
        const displayName = (user as { display_name?: string | null }).display_name ?? '';
        return {
          id: user.id,
          role: user.role,
          permissions,
          displayName,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
        token.displayName = (user as { displayName?: string }).displayName ?? '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        // Fetch fresh permissions from database on every session check
        const supabase = getServiceClient();
        const { data: userData } = await supabase
          .from('users')
          .select('role, display_name')
          .eq('id', token.userId)
          .single();
        
        const { data: perms } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', token.userId);
        
        const freshPermissions = (perms ?? []).map((p) => p.permission);
        const currentRole = userData?.role ?? (token.role as string);
        const displayName = userData?.display_name ?? (token.displayName as string) ?? '';
        
        (session.user as { id: string }).id = token.userId as string;
        (session.user as { role: string }).role = currentRole;
        (session.user as { permissions: string[] }).permissions = freshPermissions;
        (session.user as { displayName: string }).displayName = displayName;
      }
      return session;
    },
  },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

export type { Permission } from './permissions';
export { ALL_PERMISSIONS } from './permissions';
import type { Permission } from './permissions';

export function hasPermission(role: string, permissions: string[], perm: Permission): boolean {
  if (role === 'superadmin') return true;
  return permissions.includes(perm);
}
