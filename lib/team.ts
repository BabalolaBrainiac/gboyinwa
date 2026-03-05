import { getServiceClient, hasSupabaseEnv } from './supabase';

export type TeamMember = {
  id: string;
  full_name: string;
  title: string;
  image_url: string | null;
  sort_order: number;
};

export async function getTeamMembers(): Promise<TeamMember[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = getServiceClient();
  const { data } = await supabase.from('team_members').select('*').order('sort_order', { ascending: true });
  return data ?? [];
}
