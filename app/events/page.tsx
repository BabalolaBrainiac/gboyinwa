import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getEvents } from '@/lib/events';
import { Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 yellow-fade-top pointer-events-none" />
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/15 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
              <Calendar className="w-3.5 h-3.5" />
              Upcoming Events
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-3">
              Events
            </h1>
            <p className="text-base text-brand-black/60 dark:text-brand-yellow/60 max-w-xl mx-auto">
              Discover screenings, workshops, and opportunities to connect with the documentary filmmaking community.
            </p>
          </div>
        </section>

        {/* Events Grid */}
        <section className="section-padding pt-0">
          <div className="max-w-6xl mx-auto">
            {events.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((event, i) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group glass-card overflow-hidden hover:border-brand-orange dark:hover:border-brand-yellow transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={event.image_url || '/images/logo-full.png'}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {event.featured && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-brand-yellow text-brand-black text-xs font-bold">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="text-base font-bold text-brand-black dark:text-brand-yellow mb-2 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                        {event.title}
                      </h2>
                      {event.summary && (
                        <p className="text-brand-black/60 dark:text-brand-yellow/60 text-sm line-clamp-2 mb-3">
                          {event.summary}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-brand-black/50 dark:text-brand-yellow/50">
                        {event.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(event.start_date).toLocaleDateString('en-NG', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-brand-green dark:text-brand-yellow" />
                </div>
                <h2 className="text-xl font-bold text-brand-black dark:text-brand-yellow mb-2">
                  No events yet
                </h2>
                <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                  Check back soon for upcoming screenings and workshops.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section - Host an Event */}
        <section className="pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden bg-brand-green dark:bg-[#060f06]">
              {/* Yellow accent glows - perfect for yellow buttons */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-brand-yellow/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
              <div className="absolute top-1/2 right-0 w-48 h-48 bg-brand-violet/10 rounded-full blur-3xl -translate-y-1/2" />
              
              {/* Yellow accent lines */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-yellow/20 to-transparent" />

              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(rgba(244,196,48,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(244,196,48,0.3) 1px, transparent 1px)`,
                  backgroundSize: '50px 50px'
                }} />
              </div>

              <div className="relative px-6 py-10 md:px-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/15 text-brand-yellow text-xs font-bold uppercase mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Partner With Us
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Host an Event with Us
                </h2>
                
                <p className="text-white/60 max-w-md mx-auto mb-6 text-sm">
                  Interested in partnering for a screening or workshop? We&apos;d love to hear from you.
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
