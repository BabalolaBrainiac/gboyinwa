import { getServiceClient, hasSupabaseEnv } from './supabase';

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.href;
  } catch {
    return null;
  }
}

function sanitizeEvent(event: Event): Event {
  return { ...event, image_url: sanitizeImageUrl(event.image_url) };
}

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
  return data ? sanitizeEvent(data) : null;
}

export async function getEvents(): Promise<Event[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('published', true)
    .order('start_date', { ascending: false });
  return (data ?? []).map(sanitizeEvent);
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = getServiceClient();
  const { data } = await supabase.from('events').select('*').eq('slug', slug).eq('published', true).single();
  return data ? sanitizeEvent(data) : null;
}
