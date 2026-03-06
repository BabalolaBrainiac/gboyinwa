import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServiceClient } from './supabase';
import { hashEmail } from './hash';

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
        
        // Dynamic import argon2 to avoid client-side bundling
        const { default: argon2 } = await import('argon2');
        
        const supabase = getServiceClient();
        const emailHash = hashEmail(credentials.email);
        const { data: user, error } = await supabase
          .from('users')
          .select('id, password_hash, role, display_name')
          .eq('email_hash', emailHash)
          .single();
        if (error || !user?.password_hash) return null;
        const ok = await argon2.verify(user.password_hash, credentials.password);
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
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
        token.displayName = (user as { displayName?: string }).displayName ?? '';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.userId as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { permissions: string[] }).permissions = (token.permissions as string[]) ?? [];
        (session.user as { displayName: string }).displayName = (token.displayName as string) ?? '';
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
