import { getServiceClient, hasSupabaseEnv } from './supabase';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostListItem = Pick<BlogPost, 'id' | 'title' | 'slug' | 'excerpt' | 'cover_url' | 'published_at' | 'created_at'>;

export async function getPublishedPosts(): Promise<BlogPostListItem[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_url, published_at, created_at')
    .eq('published', true)
    .order('published_at', { ascending: false });
  return data ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  return data;
}
