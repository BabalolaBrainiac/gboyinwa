'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('password must be at least 8 characters');
      return;
    }
    if (!token) {
      setError('missing reset token');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'failed');
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-brand-green/5 dark:bg-brand-black">
        <div className="w-full max-w-sm rounded-2xl border border-brand-green/20 dark:border-brand-yellow/20 p-8 bg-white dark:bg-brand-black/50 text-center">
          <p className="text-brand-black/80 dark:text-brand-yellow/80">Invalid or missing reset link.</p>
          <Link href="/forgot-password" className="inline-block mt-4 text-brand-green dark:text-brand-yellow hover:underline">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-brand-green/5 dark:bg-brand-black">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/images/logo.png" alt="Gbóyinwá" width={40} height={40} />
        <span className="font-bold text-brand-green dark:text-brand-yellow text-xl">gbóyinwá</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-brand-green/20 dark:border-brand-yellow/20 p-8 bg-white dark:bg-brand-black/50">
        <h1 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-6">Set new password</h1>
        {done ? (
          <p className="text-brand-black/80 dark:text-brand-yellow/80 text-sm mb-4">Password updated. You can sign in now.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
        <Link href="/login" className="block text-center text-sm text-brand-green dark:text-brand-yellow hover:underline mt-6">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
