import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { getTeamMembers } from '@/lib/team';
import { Users } from 'lucide-react';

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
        <section className="relative py-20 md:py-28 px-5 sm:px-8 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-brand-yellow/5 dark:bg-brand-yellow/3 blur-[120px] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto text-center">
            <AnimateIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/12 dark:bg-brand-yellow/8 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-6">
                <Users className="w-3.5 h-3.5" />
                The People Behind the Mission
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-brand-green dark:text-brand-yellow mb-5">
                Meet the Team
              </h1>
              <p className="text-lg text-brand-black/55 dark:text-brand-yellow/55 max-w-xl mx-auto leading-relaxed">
                Dedicated professionals working to amplify authentic Nigerian voices and empower
                the next generation of documentary filmmakers.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* Team Grid */}
        <section className="pb-24 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((m, i) => (
                <AnimateIn key={m.id ?? i} delay={i * 80}>
                  <div className="group relative rounded-3xl border border-brand-black/8 dark:border-brand-yellow/8 bg-white dark:bg-[#0d0d0d] p-8 text-center overflow-hidden hover:border-brand-green/25 dark:hover:border-brand-yellow/25 hover:shadow-xl hover:shadow-brand-green/6 dark:hover:shadow-brand-yellow/4 transition-all duration-500 h-full flex flex-col items-center">

                    {/* Film sprocket corners */}
                    <div className="absolute top-4 right-4 opacity-6 group-hover:opacity-18 transition-opacity duration-300">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect x="0" y="0" width="8" height="8" rx="1.5" className="fill-brand-green dark:fill-brand-yellow" fillOpacity="0.4" />
                        <rect x="20" y="0" width="8" height="8" rx="1.5" className="fill-brand-green dark:fill-brand-yellow" fillOpacity="0.4" />
                        <rect x="0" y="20" width="8" height="8" rx="1.5" className="fill-brand-green dark:fill-brand-yellow" fillOpacity="0.4" />
                        <rect x="20" y="20" width="8" height="8" rx="1.5" className="fill-brand-green dark:fill-brand-yellow" fillOpacity="0.4" />
                      </svg>
                    </div>

                    {/* Avatar */}
                    <div className="relative mb-6">
                      <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-tr ${m.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 blur-sm`} />
                      {m.image_url ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-brand-black shadow-lg">
                          <Image src={m.image_url} alt={m.displayName} fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="96px" />
                        </div>
                      ) : (
                        <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg`}>
                          <span className="text-2xl font-bold text-white">{m.initials}</span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-brand-black dark:text-brand-yellow mb-1">
                      {m.displayName}
                    </h2>
                    <p className="text-sm font-semibold text-brand-orange dark:text-brand-yellow/70 mb-3">
                      {m.displayTitle}
                    </p>
                    <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 leading-relaxed max-w-[200px] mx-auto">
                      {m.bio}
                    </p>

                    <div className={`mt-5 h-[2px] w-0 group-hover:w-12 bg-gradient-to-r ${m.gradient} transition-all duration-500 rounded-full`} />
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 px-5 sm:px-8">
          <AnimateIn>
            <div className="max-w-3xl mx-auto rounded-3xl bg-brand-green dark:bg-[#060f06] border border-brand-green/20 dark:border-brand-yellow/10 p-10 md:p-14 text-center">
              <h2 className="text-3xl font-bold text-white dark:text-brand-yellow mb-3">Join Our Mission</h2>
              <p className="text-white/60 dark:text-brand-yellow/50 max-w-md mx-auto mb-7 leading-relaxed text-sm">
                We&apos;re always looking for passionate individuals who believe in the power of
                documentary storytelling to create positive change in Nigeria.
              </p>
              <a
                href="mailto:hello@gboyinwa.com"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-yellow text-brand-black font-bold text-sm hover:bg-brand-yellow/90 active:scale-[0.98] transition-all shadow-lg shadow-brand-yellow/20"
              >
                Get in Touch
              </a>
            </div>
          </AnimateIn>
        </section>

      </main>
      <Footer />
    </div>
  );
}
