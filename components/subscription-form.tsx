'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SubscriptionFormProps {
  className?: string;
  variant?: 'inline' | 'card' | 'footer';
  title?: string;
  description?: string;
}

export function SubscriptionForm({ 
  className = '',
  variant = 'card',
  title = 'Subscribe to Our Blog',
  description = 'Get the latest updates and news delivered to your inbox.'
}: SubscriptionFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          firstName: firstName || undefined,
          source: 'website'
        }),
      });

      const data = await res.json();

      if (res.ok || res.status === 201) {
        setResult({ 
          success: true, 
          message: data.message || 'Please check your email to confirm your subscription.'
        });
        setEmail('');
        setFirstName('');
      } else {
        setResult({ 
          success: false, 
          message: data.error || 'Something went wrong. Please try again.'
        });
      }
    } catch (err) {
      setResult({ 
        success: false, 
        message: 'An error occurred. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const variants = {
    inline: 'flex flex-col sm:flex-row gap-3 items-end',
    card: 'space-y-4 bg-white dark:bg-brand-black/50 p-6 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10',
    footer: 'space-y-3',
  };

  const inputClasses = 'w-full px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow placeholder:text-brand-black/40 dark:placeholder:text-brand-yellow/40 focus:outline-none focus:ring-2 focus:ring-brand-green/50';

  if (variant === 'footer') {
    return (
      <form onSubmit={handleSubmit} className={className}>
        <p className="text-sm text-brand-yellow/70 mb-3">{title}</p>
        
        {result ? (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${result.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {result.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <p className="text-sm">{result.message}</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              className="flex-1 px-3 py-2 rounded bg-brand-black/50 border border-brand-yellow/20 text-brand-yellow placeholder:text-brand-yellow/40 text-sm focus:outline-none focus:border-brand-yellow/50"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-brand-yellow text-brand-black rounded text-sm font-medium hover:bg-brand-yellow/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
            </button>
          </div>
        )}
      </form>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className={variants[variant]}>
        {variant === 'card' && (
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 mb-3">
              <Mail className="w-6 h-6 text-brand-green dark:text-brand-yellow" />
            </div>
            <h3 className="text-lg font-semibold text-brand-black dark:text-brand-yellow">{title}</h3>
            <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 mt-1">{description}</p>
          </div>
        )}

        {variant === 'inline' && (
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputClasses}
            />
          </div>
        )}

        {variant === 'card' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputClasses}
              />
            </div>
          </div>
        )}

        {result ? (
          <div className={`flex items-start gap-2 p-4 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
            {result.success ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <p className="text-sm">{result.message}</p>
          </div>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors ${variant === 'inline' ? 'sm:w-auto w-full' : 'w-full'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Subscribe
              </>
            )}
          </button>
        )}

        {variant === 'card' && (
          <p className="text-xs text-center text-brand-black/40 dark:text-brand-yellow/40">
            We respect your privacy. Unsubscribe at any time.
          </p>
        )}
      </form>
    </div>
  );
}
