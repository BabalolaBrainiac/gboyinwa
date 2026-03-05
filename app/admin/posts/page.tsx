import { getServiceClient, hasSupabaseEnv } from '@/lib/supabase';
import type { BlogPost } from '@/lib/blog';
import { AdminPostsClient } from './admin-posts-client';

export default async function AdminPostsPage() {
  let posts: BlogPost[] = [];
  if (hasSupabaseEnv()) {
    try {
      const supabase = getServiceClient();
      const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      posts = data ?? [];
    } catch {
      posts = [];
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-6">Blog posts</h1>
      <AdminPostsClient posts={posts} />
    </div>
  );
}
