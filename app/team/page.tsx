import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Team members with correct names, titles, and photos
const TEAM_MEMBERS = [
  {
    id: 'oluwatimilehin-coker',
    full_name: 'Oluwatimilehin Coker',
    displayName: 'Oluwatimilehin Coker',
    displayTitle: 'Chief Executive Officer (CEO)',
    bio: 'Leading the vision and driving the mission forward.',
    gradient: 'from-brand-green to-brand-violet',
    initials: 'OC',
    image_url: 'https://pub-0124c2167358caa5855f58febceadbe8.r2.dev/assets/team/oluwatimilehin.jpg',
  },
  {
    id: 'daniel-adeyinka',
    full_name: 'Daniel Adeyinka',
    displayName: 'Daniel Adeyinka',
    displayTitle: 'Chief Creative Officer (CCO)',
    bio: 'Turning complex narratives into clarity. Words are his currency.',
    gradient: 'from-brand-orange to-brand-yellow',
    initials: 'DA',
    image_url: 'https://pub-0124c2167358caa5855f58febceadbe8.r2.dev/assets/team/daniel.jpg',
  },
  {
    id: 'tari-akinnukawe',
    full_name: 'Tari Akinnukawe',
    displayName: 'Tari Akinnukawe',
    displayTitle: 'Chief Operating Officer (COO)',
    bio: 'Protecting the work, enabling the vision.',
    gradient: 'from-brand-violet to-brand-orange',
    initials: 'TA',
    image_url: 'https://pub-0124c2167358caa5855f58febceadbe8.r2.dev/assets/team/tari.jpg',
  },
  {
    id: 'opeyemi-babalola',
    full_name: 'Opeyemi Babalola',
    displayName: 'Opeyemi Babalola',
    displayTitle: 'Chief Technical Officer (CTO)',
    bio: 'Building the technology that powers our storytelling.',
    gradient: 'from-brand-yellow to-brand-orange',
    initials: 'OB',
    image_url: 'https://pub-0124c2167358caa5855f58febceadbe8.r2.dev/assets/team/opeyemi.jpg',
  },
  {
    id: 'karamat-eko',
    full_name: 'Karamat Eko',
    displayName: 'Karamat Eko',
    displayTitle: 'Program Coordinator',
    bio: 'Moving the pieces so everyone else can create.',
    gradient: 'from-brand-green to-brand-violet',
    initials: 'KE',
    image_url: 'https://pub-0124c2167358caa5855f58febceadbe8.r2.dev/assets/team/karamat.jpg',
  },
  {
    id: 'victoria-ogunwemimo',
    full_name: 'Victoria "Aladunni" Ogunwemimo',
    displayName: 'Victoria "Aladunni" Ogunwemimo',
    displayTitle: 'Marketing and Community Manager',
    bio: 'Here to make the magic happen.',
    gradient: 'from-brand-green to-brand-yellow',
    initials: 'VO',
    image_url: 'https://pub-0124c2167358caa5855f58febceadbe8.r2.dev/assets/team/victoria.jpg',
  },
];

export default async function TeamPage() {
  // Always use static TEAM_MEMBERS — photos and bios are authoritative here
  const members = TEAM_MEMBERS;

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
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-brand-black shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <Image
                            src={m.image_url}
                            alt={m.displayName}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="96px"
                            priority={i < 3}
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                          <span className="text-2xl font-bold text-white">{m.initials}</span>
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
