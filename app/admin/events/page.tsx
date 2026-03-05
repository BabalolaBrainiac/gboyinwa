import { getServiceClient, hasSupabaseEnv } from '@/lib/supabase';
import type { Event } from '@/lib/events';
import { AdminEventsClient } from './admin-events-client';

export default async function AdminEventsPage() {
  let events: Event[] = [];
  if (hasSupabaseEnv()) {
    try {
      const supabase = getServiceClient();
      const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      events = data ?? [];
    } catch {
      events = [];
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-6">Events</h1>
      <AdminEventsClient events={events} />
    </div>
  );
}
