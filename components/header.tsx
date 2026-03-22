'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { Menu, X, Sun, Moon, Shield, LayoutDashboard } from 'lucide-react';
import { ScrollProgress } from './scroll-progress';

export function Header() {
  const { data: session, status } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setAtTop(currentY < 10);

      if (currentY < lastScrollY.current || currentY < 60) {
        setVisible(true);
      } else if (currentY > lastScrollY.current && currentY > 60) {
        setVisible(false);
        setMobileOpen(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const displayName = (session?.user as { displayName?: string } | undefined)?.displayName ?? 'User';
  const role = (session?.user as { role?: string })?.role;
  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isDark = resolvedTheme === 'dark';

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/events', label: 'Events' },
    { href: '/programs', label: 'Programs' },
    { href: '/team', label: 'Team' },
    { href: '/letters', label: 'Letters' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <ScrollProgress />
      <header
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
        className={[
          'fixed top-0 left-0 right-0 z-50',
          atTop
            ? 'bg-transparent'
            : 'glass border-b border-brand-green/10 dark:border-brand-yellow/10 shadow-sm',
        ].join(' ')}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between h-18 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden">
              <Image
                src={isDark ? '/images/logomark-yellow.png' : '/images/logomark.png'}
                alt="Gbóyinwá"
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
            <span className="font-bold text-brand-green dark:text-brand-yellow text-xl tracking-tight">
              gbóyinwá
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={[
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  pathname === href
                    ? 'text-brand-green dark:text-brand-yellow bg-brand-green/10 dark:bg-brand-yellow/10'
                    : 'text-brand-black/70 dark:text-brand-yellow/60 hover:text-brand-green dark:hover:text-brand-yellow hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
            
            {/* Admin Portal link - only visible to superadmins */}
            {isSuperadmin && (
              <Link
                href="/admin"
                className={[
                  'ml-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2',
                  pathname.startsWith('/admin')
                    ? 'bg-brand-yellow text-brand-black'
                    : 'bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow hover:bg-brand-green dark:hover:bg-brand-yellow hover:text-white dark:hover:text-brand-black',
                ].join(' ')}
              >
                <Shield className="w-4 h-4" />
                Admin Portal
              </Link>
            )}
            
            {/* Content Manager link - visible to admins (but not superadmins since they have admin portal) */}
            {isAdmin && !isSuperadmin && (
              <Link
                href="/admin/posts"
                className={[
                  'ml-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2',
                  pathname.startsWith('/admin')
                    ? 'bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black'
                    : 'bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow hover:bg-brand-green dark:hover:bg-brand-yellow hover:text-white dark:hover:text-brand-black',
                ].join(' ')}
              >
                <LayoutDashboard className="w-4 h-4" />
                Manage Content
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {status === 'authenticated' && (
              <span className="hidden lg:inline text-sm text-brand-black/50 dark:text-brand-yellow/50">
                {displayName}
              </span>
            )}

            {status === 'authenticated' ? (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hidden sm:flex text-sm text-brand-black/50 dark:text-brand-yellow/50 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex text-sm font-semibold text-brand-green dark:text-brand-yellow hover:underline"
              >
                Sign in
              </Link>
            )}

            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="p-2 rounded-xl text-brand-green dark:text-brand-yellow hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-brand-green dark:text-brand-yellow hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={[
            'md:hidden overflow-hidden transition-all duration-300',
            mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
          ].join(' ')}
        >
          <nav className="glass border-t border-brand-green/10 dark:border-brand-yellow/10 flex flex-col p-4 gap-1">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={[
                  'px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                  pathname === href
                    ? 'text-brand-green dark:text-brand-yellow bg-brand-green/10 dark:bg-brand-yellow/10'
                    : 'text-brand-black/70 dark:text-brand-yellow/60',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
            
            {/* Mobile Admin links */}
            {isSuperadmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-brand-yellow bg-brand-yellow/10 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin Portal
              </Link>
            )}
            {isAdmin && !isSuperadmin && (
              <Link
                href="/admin/posts"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-brand-green dark:text-brand-yellow bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Manage Content
              </Link>
            )}
            
            {status === 'authenticated' && (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-3 rounded-xl text-sm text-left text-brand-black/60 dark:text-brand-yellow/60"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
