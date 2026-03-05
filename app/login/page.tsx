'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/admin';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError('invalid email or password');
      return;
    }
    if (res?.url) window.location.href = res.url;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-brand-green/5 dark:bg-brand-black">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/images/logo.png" alt="Gbóyinwá" width={40} height={40} />
        <span className="font-bold text-brand-green dark:text-brand-yellow text-xl">gbóyinwá</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-brand-green/20 dark:border-brand-yellow/20 p-8 bg-white dark:bg-brand-black/50">
        <h1 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-black dark:text-brand-yellow/80 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow placeholder:opacity-50"
              placeholder="you@gboyinwa.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-black dark:text-brand-yellow/80 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <Link href="/forgot-password" className="block text-center text-sm text-brand-green dark:text-brand-yellow hover:underline mt-2">
            Forgot password?
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
