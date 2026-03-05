'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  published: boolean;
  cover_url?: string | null;
};

export function AdminPostsClient({ posts: initial }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initial);
  const [form, setForm] = useState<Partial<Post> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form?.title || !form?.slug || form?.body === undefined) return;
    setLoading(true);
    setError('');
    const url = form.id ? `/api/admin/posts/${form.id}` : '/api/admin/posts';
    const method = form.id ? 'PATCH' : 'POST';
    const body = form.id
      ? { title: form.title, slug: form.slug, excerpt: form.excerpt, body: form.body, cover_url: form.cover_url, published: form.published }
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
      setPosts((prev) => prev.map((p) => (p.id === form.id ? { ...p, ...data } : p)));
    } else {
      setPosts((prev) => [data, ...prev]);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          onClick={() => setForm({ title: '', slug: '', body: '', published: false })}
          className="py-2 px-4 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium"
        >
          New post
        </button>
        <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-brand-black/60 dark:text-brand-yellow/60 hover:underline">
          Sign out
        </button>
      </div>
      {form && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 space-y-4">
          <h2 className="font-semibold text-brand-black dark:text-brand-yellow">{form.id ? 'Edit post' : 'New post'}</h2>
          <input type="text" placeholder="Title" value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black" />
          <input type="text" placeholder="Slug" value={form.slug ?? ''} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black" />
          <input type="text" placeholder="Excerpt" value={form.excerpt ?? ''} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black" />
          <textarea placeholder="Body" value={form.body ?? ''} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required rows={8} className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black" />
          <input type="text" placeholder="Cover URL" value={form.cover_url ?? ''} onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30 bg-white dark:bg-brand-black" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.published ?? false} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            <span className="text-sm">Published</span>
          </label>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="py-2 px-4 rounded-lg bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium disabled:opacity-50">Save</button>
            <button type="button" onClick={() => setForm(null)} className="py-2 px-4 rounded-lg border border-brand-green/30 dark:border-brand-yellow/30">Cancel</button>
          </div>
        </form>
      )}
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="flex justify-between items-center p-4 rounded-lg border border-brand-green/20 dark:border-brand-yellow/20">
            <span className="font-medium text-brand-black dark:text-brand-yellow">{p.title}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(p)} className="text-sm text-brand-green dark:text-brand-yellow hover:underline">Edit</button>
              <button type="button" onClick={() => handleDelete(p.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
