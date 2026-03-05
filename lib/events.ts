import { getServiceClient, hasSupabaseEnv } from './supabase';

export type Event = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  summary: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export async function getFeaturedEvent(): Promise<Event | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('featured', true)
    .eq('published', true)
    .order('start_date', { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function getEvents(): Promise<Event[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('published', true)
    .order('start_date', { ascending: false });
  return data ?? [];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = getServiceClient();
  const { data } = await supabase.from('events').select('*').eq('slug', slug).eq('published', true).single();
  return data;
}
