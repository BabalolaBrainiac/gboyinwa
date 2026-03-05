'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Menu, X, Film, Sun, Moon } from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const displayName = (session?.user as { displayName?: string } | undefined)?.displayName ?? 'User';
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? '';

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/team', label: 'Team' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-brand-green/10 dark:border-brand-yellow/10 bg-white/90 dark:bg-brand-black/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-brand-green to-brand-violet flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-green/20 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-yellow/20 to-transparent" />
            <Film className="w-6 h-6 text-white relative z-10" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-brand-green dark:text-brand-yellow text-xl block leading-none">
              gbóyinwá
            </span>
            <span className="text-[10px] text-brand-black/50 dark:text-brand-yellow/50 uppercase tracking-wider">
              Media
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === href
                  ? 'text-brand-green dark:text-brand-yellow bg-brand-green/10 dark:bg-brand-yellow/10'
                  : 'text-brand-black/70 dark:text-brand-yellow/70 hover:text-brand-green dark:hover:text-brand-yellow hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Welcome message */}
          {status === 'authenticated' && (
            <span className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-sm">
              <span className="w-2 h-2 rounded-full bg-brand-green dark:bg-brand-yellow animate-pulse" />
              Welcome, {displayName}
            </span>
          )}
          
          {/* Auth buttons */}
          {status === 'authenticated' ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="hidden sm:flex text-sm text-brand-black/60 dark:text-brand-yellow/60 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex text-sm font-medium text-brand-green dark:text-brand-yellow hover:underline"
            >
              Sign in
            </Link>
          )}
          
          {/* Theme toggle */}
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow hover:scale-105 transition-transform"
              aria-label="toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-brand-green dark:text-brand-yellow"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-green/10 dark:border-brand-yellow/10 bg-white dark:bg-brand-black">
          <nav className="flex flex-col p-4 gap-2">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'text-brand-green dark:text-brand-yellow bg-brand-green/10 dark:bg-brand-yellow/10'
                    : 'text-brand-black/70 dark:text-brand-yellow/70 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5'
                }`}
              >
                {label}
              </Link>
            ))}
            {status === 'authenticated' && userRole === 'superadmin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-medium text-brand-orange dark:text-brand-yellow hover:bg-brand-orange/5"
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
