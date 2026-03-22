import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { getEvents } from '@/lib/events';
import { ArrowLeft, Heart, Mail, ArrowRight, Calendar, MapPin, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'Volunteer | Gbóyinwá Media',
  description: 'Volunteer on ongoing Gbóyinwá projects and contribute your skills to authentic Nigerian storytelling.',
};

export default async function VolunteerPage() {
  const allEvents = await getEvents();

  // Surface ongoing programs/initiatives as volunteer opportunities
  const ongoingProjects = allEvents.filter(
    (e) =>
      !e.start_date ||
      e.slug?.toLowerCase().includes('grant') ||
      e.slug?.toLowerCase().includes('program') ||
      e.slug?.toLowerCase().includes('initiative') ||
      e.title?.toLowerCase().includes('grant') ||
      e.title?.toLowerCase().includes('program')
  );

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-black">
      <Header />
      <main className="flex-1 pt-20">

        {/* Hero */}
        <section className="relative py-16 md:py-20 px-5 sm:px-8 overflow-hidden">
          <div className="absolute inset-0 yellow-fade-top pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <AnimateIn>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 text-brand-green dark:text-brand-yellow hover:underline text-sm mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Join the Mission
              </Link>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/15 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-5">
                <Heart className="w-3.5 h-3.5" />
                Volunteer
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-4">
                Contribute Your Skills
              </h1>
              <p className="text-base text-brand-black/60 dark:text-brand-yellow/60 max-w-xl leading-relaxed">
                Our projects need people who care. Whether you&apos;re a filmmaker, writer, designer,
                researcher, or community organiser — your skills have a home here.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* How it works */}
        <section className="px-5 sm:px-8 pb-10">
          <div className="max-w-4xl mx-auto">
            <AnimateIn>
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <h2 className="text-lg font-bold text-brand-green dark:text-brand-yellow mb-3">
                  How to Get Involved
                </h2>
                <ol className="space-y-3 text-sm text-brand-black/70 dark:text-brand-yellow/70 list-none">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Browse the ongoing projects below and find one where your skills fit.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Email us at <a href="mailto:hello@gboyinwa.com?subject=Volunteer Interest" className="text-brand-green dark:text-brand-yellow underline underline-offset-2">hello@gboyinwa.com</a> with the subject line <strong>&quot;Volunteer – [Project Name]&quot;</strong>, telling us who you are, what you can contribute, and how much time you can commit.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>We&apos;ll schedule a brief conversation to align on expectations and next steps.</span>
                  </li>
                </ol>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* Ongoing Projects */}
        <section className="px-5 sm:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-6">
              Ongoing Projects
            </h2>

            {ongoingProjects.length > 0 ? (
              <div className="space-y-4">
                {ongoingProjects.map((project, i) => (
                  <AnimateIn key={project.id} delay={i * 80}>
                    <div className="glass-card rounded-2xl p-6 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-semibold">
                            Ongoing
                          </span>
                          {project.location && (
                            <span className="flex items-center gap-1 text-xs text-brand-black/50 dark:text-brand-yellow/50">
                              <MapPin className="w-3 h-3" />
                              {project.location}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-brand-black dark:text-brand-yellow">{project.title}</h3>
                        {project.summary && (
                          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 mt-1 line-clamp-2 leading-relaxed">
                            {project.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Link
                          href={`/events/${project.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 text-brand-green dark:text-brand-yellow text-xs font-semibold hover:bg-brand-green/5 dark:hover:bg-brand-yellow/5 transition-all"
                        >
                          Details
                        </Link>
                        <a
                          href={`mailto:hello@gboyinwa.com?subject=Volunteer – ${encodeURIComponent(project.title)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange/90 transition-all"
                        >
                          Volunteer
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            ) : (
              <AnimateIn>
                <div className="rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
                    <Layers className="w-7 h-7 text-brand-orange" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-green dark:text-brand-yellow mb-2">
                    No open projects right now
                  </h3>
                  <p className="text-sm text-brand-black/55 dark:text-brand-yellow/55 max-w-sm mx-auto mb-6">
                    We&apos;ll post volunteer opportunities here as projects kick off. In the meantime, send us an introduction.
                  </p>
                  <a
                    href="mailto:hello@gboyinwa.com?subject=Volunteer Interest"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orange/90 active:scale-[0.98] transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Express interest
                  </a>
                </div>
              </AnimateIn>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
