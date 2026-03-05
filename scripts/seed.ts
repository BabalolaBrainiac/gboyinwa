/**
 * Seed: Gbóyindé Grant event (public-facing only, no financials), sample blog post, team members.
 * Run after migrations. Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const GRANT_EVENT = {
  title: 'The Gbóyindé Grant for Young Documentary Filmmakers in Nigeria',
  slug: 'gboyinde-grant-young-documentary-filmmakers',
  summary:
    'A transformative opportunity to invest in Nigeria\'s emerging documentary film talent. Five young filmmakers will create short documentaries exploring the hidden magic of everyday Lagos life—with production funding, screening events, and distribution support.',
  description: `Magic in Èkó Grey

The Gbóyindé Grant is a cultural investment in the next generation of Nigerian storytellers. Documentary filmmaking preserves truth, celebrates diversity, and elevates marginalized voices.

What we're doing:
• Empowering five emerging documentary filmmakers with production funding
• Creating five original short documentary films exploring Lagos's hidden narratives
• Providing platform and distribution opportunities that extend far beyond initial production
• Building a sustainable model for ongoing support of documentary filmmaking and arts in Nigeria

Timeline: 9 months from launch to final distribution.

Expected outcomes:
• 5 completed short documentary films (10–45 minutes each)
• 1 major public screening event
• Festival submissions to 10+ local and international film festivals
• Digital distribution across multiple platforms
• Media coverage reaching a wide audience

Partnership categories: Financial sponsorship, material and in-kind support, and strategic partnerships with cultural institutions, media houses, film festivals, and educational bodies.`,
  start_date: '2026-02-01',
  end_date: null,
  location: 'Lagos, Nigeria',
  image_url: null,
  featured: true,
  published: true,
};

const TEAM = [
  { full_name: 'Daniel Ayodele Adeyinka', title: 'Communications Lead', sort_order: 1 },
  { full_name: 'Karamat Ademilade', title: 'Eko Lead Project Manager', sort_order: 2 },
  { full_name: 'Taribo Adeyinka Akinnukawe', title: 'Legal Lead', sort_order: 3 },
  { full_name: 'Opeyemi Daniel Babalola', title: 'Software Engineer', sort_order: 4 },
  { full_name: 'Victoria Adunni Ogunwemimo', title: 'Team', sort_order: 5 },
  { full_name: 'Oluwatimilehin Michael Coker', title: 'Chief of Operations', sort_order: 6 },
];

async function main() {
  // Get superadmin ID for author reference
  const { data: superadmin } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'superadmin')
    .limit(1)
    .single();

  const SAMPLE_POST = {
    title: 'Welcome to the Gbóyinwá blog',
    slug: 'welcome-to-gboyinwa-blog',
    excerpt: 'Introducing our space for stories, updates, and behind-the-scenes from the team.',
    body: `Welcome to the Gbóyinwá blog.

Here we'll share updates on our projects, documentary work, and the people and stories behind Lagos. We believe in the power of documentary to preserve truth and elevate marginalized voices.

Stay tuned for more content about our films, behind-the-scenes looks at productions, and stories from the amazing filmmakers we're working with.

— The Gbóyinwá Team`,
    cover_url: null,
    published: true,
    published_at: new Date().toISOString(),
    author_id: superadmin?.id || null,
  };

  const { data: existingEvent } = await supabase.from('events').select('id').eq('slug', GRANT_EVENT.slug).single();
  if (!existingEvent) {
    const { error: e1 } = await supabase.from('events').insert(GRANT_EVENT);
    if (e1) console.error('event insert:', e1.message);
    else console.log('inserted grant event');
  }

  const { data: existingPost } = await supabase.from('blog_posts').select('id').eq('slug', SAMPLE_POST.slug).single();
  if (!existingPost) {
    const { error: e2 } = await supabase.from('blog_posts').insert(SAMPLE_POST);
    if (e2) console.error('post insert:', e2.message);
    else console.log('inserted sample post');
  }

  const { data: existingTeam } = await supabase.from('team_members').select('id').limit(1);
  if (!existingTeam?.length) {
    const { error: e3 } = await supabase.from('team_members').insert(TEAM);
    if (e3) console.error('team insert:', e3.message);
    else console.log('inserted team members');
  }

  console.log('seed done');
}

main();
