'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111] rounded-3xl shadow-2xl p-8 sm:p-10 animate-fade-in-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-brand-black/40 dark:text-brand-yellow/40 hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'success' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-brand-green dark:text-brand-yellow" />
            </div>
            <h3 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-2">Message sent!</h3>
            <p className="text-brand-black/60 dark:text-brand-yellow/60 mb-6 text-sm">We&apos;ll get back to you soon.</p>
            <button
              type="button"
              onClick={() => { setStatus('idle'); onClose(); }}
              className="px-6 py-2.5 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-1">Send us a message</h2>
            <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50 mb-7">We read every message.</p>

            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Something went wrong. Please try again.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-black/50 dark:text-brand-yellow/50 mb-1.5 uppercase tracking-wider">Name</label>
                <input
                  ref={firstRef}
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-transparent text-brand-black dark:text-brand-yellow placeholder-brand-black/30 dark:placeholder-brand-yellow/30 focus:outline-none focus:ring-2 focus:ring-brand-green/25 dark:focus:ring-brand-yellow/25 text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-black/50 dark:text-brand-yellow/50 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-transparent text-brand-black dark:text-brand-yellow placeholder-brand-black/30 dark:placeholder-brand-yellow/30 focus:outline-none focus:ring-2 focus:ring-brand-green/25 dark:focus:ring-brand-yellow/25 text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-black/50 dark:text-brand-yellow/50 mb-1.5 uppercase tracking-wider">Message</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="What&apos;s on your mind?"
                  className="w-full px-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-transparent text-brand-black dark:text-brand-yellow placeholder-brand-black/30 dark:placeholder-brand-yellow/30 focus:outline-none focus:ring-2 focus:ring-brand-green/25 dark:focus:ring-brand-yellow/25 text-sm transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {status === 'loading' ? 'Sending…' : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
