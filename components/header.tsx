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
    <header className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-violet flex items-center justify-center overflow-hidden">
            <Film className="w-5 h-5 text-white relative z-10" />
          </div>
          <span className="font-bold text-brand-green dark:text-brand-yellow text-xl">
            gbóyinwá
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-brand-green dark:text-brand-yellow bg-brand-green/10 dark:bg-brand-yellow/10'
                  : 'text-brand-black/70 dark:text-brand-yellow/70 hover:text-brand-green dark:hover:text-brand-yellow hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {status === 'authenticated' && (
            <span className="hidden lg:inline-flex items-center gap-2 text-sm text-brand-black/60 dark:text-brand-yellow/60">
              Welcome, {displayName}
            </span>
          )}
          
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
          
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-brand-green dark:text-brand-yellow hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

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
        <div className="md:hidden bg-white/95 dark:bg-brand-black/95 backdrop-blur">
          <nav className="flex flex-col p-4 gap-2">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium ${
                  pathname === href
                    ? 'text-brand-green dark:text-brand-yellow bg-brand-green/10 dark:bg-brand-yellow/10'
                    : 'text-brand-black/70 dark:text-brand-yellow/70'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
