import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { getTeamMembers } from '@/lib/team';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

// Display-layer overrides — applied over DB data if names match, otherwise used as static fallback
const TEAM_OVERRIDES: Record<string, { displayName?: string; displayTitle?: string; bio: string; gradient: string; initials: string }> = {
  'Karamat Ademilade Eko': {
    displayName: 'Karamat Eko',
    displayTitle: 'Lead Project Manager',
    bio: 'Moving the pieces so everyone else can create.',
    gradient: 'from-brand-green to-brand-violet',
    initials: 'KE',
  },
  'Opeyemi Daniel Babalola': {
    displayName: 'Opeyemi',
    displayTitle: 'Nerd',
    bio: 'software, epic fantasy, books, music and everything else in between.',
    gradient: 'from-brand-yellow to-brand-orange',
    initials: 'OB',
  },
  'Daniel Ayodele Adeyinka': {
    bio: 'Turning complex narratives into clarity. Words are his currency.',
    gradient: 'from-brand-orange to-brand-yellow',
    initials: 'DA',
  },
  'Taribo Adeyinka Akinnukawe': {
    displayName: 'Taribo Akinnukawe',
    bio: 'Protecting the work, enabling the vision.',
    gradient: 'from-brand-violet to-brand-orange',
    initials: 'TA',
  },
  'Victoria Adunni Ogunwemimo': {
    displayName: 'Victoria Ogunwemimo',
    bio: 'Here to make the magic happen.',
    gradient: 'from-brand-green to-brand-yellow',
    initials: 'VO',
  },
  'Oluwatimilehin Michael Coker': {
    displayName: 'Timilehin Coker',
    bio: 'Keeping the engine running at full throttle.',
    gradient: 'from-brand-violet to-brand-green',
    initials: 'TC',
  },
};

const FALLBACK_ORDER = [
  'Daniel Ayodele Adeyinka',
  'Karamat Ademilade Eko',
  'Taribo Adeyinka Akinnukawe',
  'Opeyemi Daniel Babalola',
  'Victoria Adunni Ogunwemimo',
  'Oluwatimilehin Michael Coker',
];

const STATIC_TEAM = FALLBACK_ORDER.map((name) => {
  const o = TEAM_OVERRIDES[name] ?? { bio: 'Part of the team making it happen.', gradient: 'from-brand-green to-brand-yellow', initials: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() };
  return { id: name, full_name: name, title: '', image_url: '', ...o };
});

type RawMember = { id: string; full_name: string; title: string; image_url: string | null; sort_order?: number };

function mergeOverrides(member: RawMember) {
  const o = TEAM_OVERRIDES[member.full_name];
  return {
    ...member,
    displayName: o?.displayName ?? member.full_name,
    displayTitle: o?.displayTitle ?? member.title,
    bio: o?.bio ?? 'Part of the team making it happen.',
    gradient: o?.gradient ?? 'from-brand-green to-brand-yellow',
    initials: o?.initials ?? member.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
  };
}

export default async function TeamPage() {
  const dbMembers = await getTeamMembers();
  const rawMembers: RawMember[] = dbMembers.length > 0
    ? dbMembers
    : STATIC_TEAM;
  const members = rawMembers.map(mergeOverrides);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-black">
      <Header />
      <main className="flex-1 pt-24">

        {/* Hero */}
        <section className="relative py-16 md:py-20 px-5 sm:px-8 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-yellow/5 dark:bg-brand-yellow/3 blur-[100px] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto text-center">
            <AnimateIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/12 dark:bg-brand-yellow/8 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-5">
                <Users className="w-3.5 h-3.5" />
                The People Behind the Mission
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-brand-green dark:text-brand-yellow mb-4">
                Meet the Team
              </h1>
              <p className="text-base text-brand-black/55 dark:text-brand-yellow/55 max-w-lg mx-auto leading-relaxed">
                Dedicated professionals working to amplify authentic Nigerian voices and empower
                the next generation of documentary filmmakers.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* Team Grid */}
        <section className="pb-16 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {members.map((m, i) => (
                <AnimateIn key={m.id ?? i} delay={i * 80}>
                  <div className="group relative rounded-2xl glass-card p-6 text-center overflow-hidden transition-all duration-500 h-full flex flex-col items-center hover:shadow-2xl hover:shadow-brand-green/10 dark:hover:shadow-brand-yellow/10 hover:-translate-y-2 hover:scale-[1.02]">
                    {/* Hover glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    
                    {/* Top accent line */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r ${m.gradient} rounded-full group-hover:w-16 transition-all duration-500`} />

                    {/* Avatar */}
                    <div className="relative mb-4">
                      <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr ${m.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-400 blur-md`} />
                      {m.image_url ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-brand-black shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <Image src={m.image_url} alt={m.displayName} fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="80px" />
                        </div>
                      ) : (
                        <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                          <span className="text-xl font-bold text-white">{m.initials}</span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-brand-black dark:text-brand-yellow mb-1">
                      {m.displayName}
                    </h2>
                    <p className="text-sm font-semibold text-brand-orange dark:text-brand-yellow/70 mb-2">
                      {m.displayTitle}
                    </p>
                    <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 leading-relaxed max-w-[200px] mx-auto">
                      {m.bio}
                    </p>

                    <div className={`mt-4 h-[2px] w-0 group-hover:w-10 bg-gradient-to-r ${m.gradient} transition-all duration-500 rounded-full`} />
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20 px-5 sm:px-8">
          <AnimateIn>
            <div className="max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-brand-green to-brand-violet p-[1px]">
              <div className="rounded-[calc(1rem-1px)] bg-white dark:bg-[#0a0a0a] p-8 md:p-10 text-center">
                <h2 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-2">Join Our Mission</h2>
                <p className="text-brand-black/60 dark:text-brand-yellow/50 max-w-sm mx-auto mb-6 leading-relaxed text-sm">
                  We&apos;re always looking for passionate individuals who believe in the power of
                  documentary storytelling to create positive change in Nigeria.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-yellow text-brand-black font-bold text-sm hover:bg-brand-yellow/90 active:scale-[0.98] transition-all shadow-lg shadow-brand-yellow/20"
                >
                  Get in Touch
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </AnimateIn>
        </section>

      </main>
      <Footer />
    </div>
  );
}
