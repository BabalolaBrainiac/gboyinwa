import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getEvents } from '@/lib/events';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function ProgramsPage() {
  const allEvents = await getEvents();

  // Programs are ongoing initiatives — events without a specific start date,
  // or events with titles/slugs indicating they are programs/grants/initiatives.
  const programs = allEvents.filter(
    (e) =>
      !e.start_date ||
      e.slug?.toLowerCase().includes('grant') ||
      e.slug?.toLowerCase().includes('program') ||
      e.slug?.toLowerCase().includes('initiative') ||
      e.title?.toLowerCase().includes('grant') ||
      e.title?.toLowerCase().includes('program') ||
      e.title?.toLowerCase().includes('initiative')
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative py-16 md:py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 yellow-fade-top pointer-events-none" />
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/15 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
              <Layers className="w-3.5 h-3.5" />
              Ongoing Initiatives
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-3">
              Programs
            </h1>
            <p className="text-base text-brand-black/60 dark:text-brand-yellow/60 max-w-xl mx-auto">
              Long-running initiatives, grants, and structured programs that support filmmakers and storytellers across Nigeria.
            </p>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="section-padding pt-0">
          <div className="max-w-6xl mx-auto">
            {programs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {programs.map((program, i) => (
                  <Link
                    key={program.id}
                    href={`/events/${program.slug}`}
                    className="group glass-card overflow-hidden hover:border-brand-orange dark:hover:border-brand-yellow transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={program.image_url || '/images/logo-full.png'}
                        alt={program.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {program.featured && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-brand-yellow text-brand-black text-xs font-bold">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="text-base font-bold text-brand-black dark:text-brand-yellow mb-2 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                        {program.title}
                      </h2>
                      {program.summary && (
                        <p className="text-brand-black/60 dark:text-brand-yellow/60 text-sm line-clamp-2 mb-3">
                          {program.summary}
                        </p>
                      )}
                      <span className="inline-flex items-center text-brand-green dark:text-brand-yellow text-xs font-semibold">
                        Learn more
                        <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                  <Layers className="w-8 h-8 text-brand-green dark:text-brand-yellow" />
                </div>
                <h2 className="text-xl font-bold text-brand-black dark:text-brand-yellow mb-2">
                  Programs coming soon
                </h2>
                <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 mb-6">
                  We&apos;re building out our programs portfolio. Check back soon.
                </p>
                <Link
                  href="/events/gboyinde-grant-young-documentary-filmmakers"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-semibold text-sm hover:opacity-90 transition-all"
                >
                  View the Gbóyindé Grant
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden bg-brand-green dark:bg-[#060f06]">
              <div className="absolute top-0 right-0 w-72 h-72 bg-brand-yellow/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent" />
              <div className="relative px-6 py-10 md:px-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/15 text-brand-yellow text-xs font-bold uppercase mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Partner With Us
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Propose a Program
                </h2>
                <p className="text-white/60 max-w-md mx-auto mb-6 text-sm">
                  Have an idea for a program or initiative that aligns with our mission? We&apos;d love to hear from you.
                </p>
                <Link
                  href="/join/partner"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-yellow text-brand-black font-bold text-sm hover:bg-brand-yellow/90 active:scale-[0.98] transition-all shadow-lg shadow-brand-yellow/20"
                >
                  Partner &amp; Invest
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
