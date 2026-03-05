import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Header } from '@/components/header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  const role = (session.user as { role?: string }).role;
  if (role !== 'superadmin' && role !== 'admin') redirect('/');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 flex">
        <aside className="w-56 border-r border-brand-green/20 dark:border-brand-yellow/20 p-4 shrink-0">
          <nav className="space-y-2">
            <Link
              href="/admin"
              className="block py-2 px-3 rounded-lg text-sm font-medium text-brand-green dark:text-brand-yellow hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/events"
              className="block py-2 px-3 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10"
            >
              Events
            </Link>
            <Link
              href="/admin/posts"
              className="block py-2 px-3 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10"
            >
              Blog posts
            </Link>
            {role === 'superadmin' && (
              <Link
                href="/admin/users"
                className="block py-2 px-3 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10"
              >
                Users
              </Link>
            )}
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
