'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setDone(false);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    setLoading(false);
    setDone(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-brand-green/5 dark:bg-brand-black">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/images/logo.png" alt="Gbóyinwá" width={40} height={40} />
        <span className="font-bold text-brand-green dark:text-brand-yellow text-xl">gbóyinwá</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-brand-green/20 dark:border-brand-yellow/20 p-8 bg-white dark:bg-brand-black/50">
        <h1 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-6">Forgot password</h1>
        {done ? (
          <p className="text-brand-black/80 dark:text-brand-yellow/80 text-sm">
            If that email exists, we sent a reset link. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
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
