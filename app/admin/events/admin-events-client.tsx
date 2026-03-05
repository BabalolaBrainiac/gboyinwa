'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

type Event = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  image_url?: string | null;
  featured: boolean;
  published: boolean;
};

export function AdminEventsClient({ events: initial }: { events: Event[] }) {
  const [events, setEvents] = useState(initial);
  const [form, setForm] = useState<Partial<Event> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form?.title || !form?.slug) return;
    setLoading(true);
    setError('');
    const url = form.id ? `/api/admin/events/${form.id}` : '/api/admin/events';
    const method = form.id ? 'PATCH' : 'POST';
    const body = form.id
      ? { title: form.title, slug: form.slug, summary: form.summary, description: form.description, start_date: form.start_date, end_date: form.end_date, location: form.location, image_url: form.image_url, featured: form.featured, published: form.published }
      : form;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'failed');
      return;
    }
    setForm(null);
    router.refresh();
    if (form.id) {
      setEvents((prev) => prev.map((ev) => (ev.id === form.id ? { ...ev, ...data } : ev)));
    } else {
      setEvents((prev) => [data, ...prev]);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          onClick={() => setForm({ title: '', slug: '', summary: '', featured: false, published: true })}
          className="py-2 px-4 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium"
        >
          New event
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm text-brand-black/60 dark:text-brand-yellow/60 hover:underline"
        >
          Sign out
        </button>
      </div>
      {form && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 space-y-4">
          <h2 className="font-semibold text-brand-black dark:text-brand-yellow">{form.id ? 'Edit event' : 'New event'}</h2>
          <input
            type="text"
            placeholder="Title"
            value={form.title ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black"
          />
          <input
            type="text"
            placeholder="Slug (url)"
            value={form.slug ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
            className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black"
          />
          <textarea
            placeholder="Summary"
            value={form.summary ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black"
            rows={2}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={form.image_url ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black"
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.featured ?? false} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
            <span className="text-sm">Featured</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.published ?? true} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            <span className="text-sm">Published</span>
          </label>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="py-2 px-4 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setForm(null)} className="py-2 px-4 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30">
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="space-y-4">
        {events.map((ev) => (
          <li key={ev.id} className="flex justify-between items-center p-4 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20">
            <div>
              <span className="font-medium text-brand-black dark:text-brand-yellow">{ev.title}</span>
              <span className="text-sm text-brand-black/50 dark:text-brand-yellow/50 ml-2">/{ev.slug}</span>
              {ev.featured && <span className="ml-2 text-xs bg-brand-orange text-white dark:bg-brand-yellow dark:text-brand-black px-2 py-0.5 rounded">Featured</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ ...ev })} className="text-sm text-brand-green dark:text-brand-yellow hover:underline">Edit</button>
              <button type="button" onClick={() => handleDelete(ev.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
