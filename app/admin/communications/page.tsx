'use client';

import { useState } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission, type Permission } from '@/lib/permissions';

export default function CommunicationsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? '';
  const permissions = ((session?.user as { permissions?: string[] })?.permissions ?? []) as Permission[];

  const canSendStaff = hasPermission(role, permissions, 'communications:send_staff');
  const canSendSubscribers = hasPermission(role, permissions, 'communications:send_subscribers');

  const [form, setForm] = useState({
    subject: '',
    content: '',
    recipientType: 'staff' as 'staff' | 'subscribers',
  });
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResult(null);

    try {
      const endpoint = form.recipientType === 'staff' 
        ? '/api/admin/communications' 
        : '/api/admin/campaigns';

      const body = form.recipientType === 'staff'
        ? { subject: form.subject, content: form.content }
        : { 
            name: `Quick ${form.recipientType} email`,
            subject: form.subject, 
            content: form.content,
            recipientType: form.recipientType,
            sendNow: true 
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: `Email sent successfully to ${data.sent || 'recipients'}` });
        setForm({ subject: '', content: '', recipientType: 'staff' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'An error occurred' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-black dark:text-brand-yellow flex items-center gap-3">
          <Mail className="w-6 h-6" />
          Communications
        </h1>
        <p className="text-brand-black/60 dark:text-brand-yellow/60 mt-1">
          Send emails to staff members or subscribers
        </p>
      </div>

      {/* Permission notice */}
      {!canSendStaff && !canSendSubscribers && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Access Denied</h3>
              <p className="text-sm text-red-600">
                You do not have permission to send emails. Contact a superadmin for access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result message */}
      {result && (
        <div className={`p-4 rounded-lg mb-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Success' : 'Error'}
              </h3>
              <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email form */}
      {(canSendStaff || canSendSubscribers) && (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-brand-black/50 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10 p-6">
          {/* Recipient type */}
          <div>
            <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">
              Send To
            </label>
            <div className="flex gap-4">
              {canSendStaff && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    value="staff"
                    checked={form.recipientType === 'staff'}
                    onChange={(e) => setForm({ ...form, recipientType: e.target.value as 'staff' })}
                    className="w-4 h-4 text-brand-green focus:ring-brand-green"
                  />
                  <Users className="w-4 h-4" />
                  <span className="text-sm text-brand-black dark:text-brand-yellow">All Staff</span>
                </label>
              )}
              {canSendSubscribers && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    value="subscribers"
                    checked={form.recipientType === 'subscribers'}
                    onChange={(e) => setForm({ ...form, recipientType: e.target.value as 'subscribers' })}
                    className="w-4 h-4 text-brand-green focus:ring-brand-green"
                  />
                  <Mail className="w-4 h-4" />
                  <span className="text-sm text-brand-black dark:text-brand-yellow">All Subscribers</span>
                </label>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
              placeholder="Enter email subject"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">
              Message
            </label>
            <textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={10}
              className="w-full px-4 py-2 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-green/50 resize-y"
              placeholder="Enter your message (HTML is supported)"
            />
            <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 mt-1">
              HTML formatting is supported. Use {'<p>'} for paragraphs, {'<a>'} for links, etc.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black rounded-lg hover:bg-brand-green/90 dark:hover:bg-brand-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 rounded-lg bg-brand-green/5 dark:bg-brand-yellow/5 border border-brand-green/10 dark:border-brand-yellow/10">
        <h3 className="font-medium text-brand-black dark:text-brand-yellow mb-2">Tips</h3>
        <ul className="text-sm text-brand-black/70 dark:text-brand-yellow/70 space-y-1 list-disc list-inside">
          <li>Keep emails concise and focused</li>
          <li>Use clear subject lines</li>
          <li>Test your HTML formatting before sending</li>
          <li>For complex campaigns, use the Campaigns page instead</li>
        </ul>
      </div>
    </div>
  );
}
