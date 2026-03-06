'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { Send, CheckCircle, AlertCircle, Mail, MessageSquare, User } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: `Subject: ${form.subject}\n\n${form.message}`,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-black">
      <Header />
      <main className="flex-1 pt-24">
        
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 px-5 sm:px-8 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-yellow/5 dark:bg-brand-yellow/3 blur-[100px] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto text-center">
            <AnimateIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/12 dark:bg-brand-yellow/8 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-5">
                <Mail className="w-3.5 h-3.5" />
                Get in Touch
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-4">
                Send Us a Message
              </h1>
              <p className="text-base text-brand-black/55 dark:text-brand-yellow/55 max-w-lg mx-auto leading-relaxed">
                Have a question, collaboration idea, or just want to say hello? 
                We&apos;d love to hear from you. Every message goes directly to our team.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* Contact Form */}
        <section className="pb-20 px-5 sm:px-8">
          <div className="max-w-2xl mx-auto">
            <AnimateIn>
              <div className="glass-card rounded-3xl p-6 md:p-10">
                {status === 'success' ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-brand-green dark:text-brand-yellow" />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-2">Message sent!</h3>
                    <p className="text-brand-black/60 dark:text-brand-yellow/60 mb-6">Thank you for reaching out. We&apos;ll get back to you at hello@gboyinwa.com soon.</p>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="px-6 py-2.5 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-brand-green dark:text-brand-yellow" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-brand-green dark:text-brand-yellow">Contact Form</h2>
                        <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50">All messages are sent to hello@gboyinwa.com</p>
                      </div>
                    </div>

                    {status === 'error' && (
                      <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Something went wrong. Please try again.
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-brand-black/60 dark:text-brand-yellow/60 mb-2 uppercase tracking-wider">
                            Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/30 dark:text-brand-yellow/30" />
                            <input
                              type="text"
                              required
                              value={form.name}
                              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                              placeholder="Your name"
                              className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-green/15 dark:border-brand-yellow/15 bg-white/50 dark:bg-brand-black/30 text-brand-black dark:text-brand-yellow placeholder-brand-black/30 dark:placeholder-brand-yellow/30 focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:focus:ring-brand-yellow/20 text-sm transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-black/60 dark:text-brand-yellow/60 mb-2 uppercase tracking-wider">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-black/30 dark:text-brand-yellow/30" />
                            <input
                              type="email"
                              required
                              value={form.email}
                              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                              placeholder="you@example.com"
                              className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-green/15 dark:border-brand-yellow/15 bg-white/50 dark:bg-brand-black/30 text-brand-black dark:text-brand-yellow placeholder-brand-black/30 dark:placeholder-brand-yellow/30 focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:focus:ring-brand-yellow/20 text-sm transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-black/60 dark:text-brand-yellow/60 mb-2 uppercase tracking-wider">
                          Subject
                        </label>
                        <input
                          type="text"
                          required
                          value={form.subject}
                          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                          placeholder="What's this about?"
                          className="w-full px-4 py-3 rounded-xl border border-brand-green/15 dark:border-brand-yellow/15 bg-white/50 dark:bg-brand-black/30 text-brand-black dark:text-brand-yellow placeholder-brand-black/30 dark:placeholder-brand-yellow/30 focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:focus:ring-brand-yellow/20 text-sm transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-black/60 dark:text-brand-yellow/60 mb-2 uppercase tracking-wider">
                          Message
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                          placeholder="Tell us what's on your mind..."
                          className="w-full px-4 py-3 rounded-xl border border-brand-green/15 dark:border-brand-yellow/15 bg-white/50 dark:bg-brand-black/30 text-brand-black dark:text-brand-yellow placeholder-brand-black/30 dark:placeholder-brand-yellow/30 focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:focus:ring-brand-yellow/20 text-sm transition-all resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        {status === 'loading' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-brand-black/30 dark:border-t-brand-black rounded-full animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </AnimateIn>

            {/* Contact Info Cards */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <AnimateIn delay={100}>
                <div className="glass-card rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-brand-yellow/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <h3 className="text-sm font-semibold text-brand-green dark:text-brand-yellow mb-1">Email Us</h3>
                  <a href="mailto:hello@gboyinwa.com" className="text-sm text-brand-black/60 dark:text-brand-yellow/60 hover:text-brand-green dark:hover:text-brand-yellow transition-colors">
                    hello@gboyinwa.com
                  </a>
                </div>
              </AnimateIn>
              <AnimateIn delay={200}>
                <div className="glass-card rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand-green dark:text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-brand-green dark:text-brand-yellow mb-1">Location</h3>
                  <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                    Lagos, Nigeria
                  </p>
                </div>
              </AnimateIn>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
