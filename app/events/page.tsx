import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getEvents } from '@/lib/events';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-yellow/10 dark:from-brand-green/20 to-transparent" />
          <div className="relative max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-brand-green dark:text-brand-yellow mb-4">
              Events
            </h1>
            <p className="text-xl text-brand-black/70 dark:text-brand-yellow/70 max-w-2xl mx-auto">
              Discover screenings, workshops, and opportunities to connect with the documentary filmmaking community.
            </p>
          </div>
        </section>

        {/* Events Grid */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {events.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event, i) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group card-hover overflow-hidden animate-fade-in-up"
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
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-brand-yellow text-brand-black text-xs font-bold">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-brand-black dark:text-brand-yellow mb-2 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                        {event.title}
                      </h2>
                      {event.summary && (
                        <p className="text-brand-black/70 dark:text-brand-yellow/70 text-sm line-clamp-2 mb-4">
                          {event.summary}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-brand-black/50 dark:text-brand-yellow/50">
                        {event.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.start_date).toLocaleDateString('en-NG', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-brand-green dark:text-brand-yellow" />
                </div>
                <h2 className="text-2xl font-bold text-brand-black dark:text-brand-yellow mb-2">
                  No events yet
                </h2>
                <p className="text-brand-black/60 dark:text-brand-yellow/60">
                  Check back soon for upcoming screenings and workshops.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl bg-brand-green dark:bg-brand-yellow/10 p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold text-white dark:text-brand-yellow mb-4">
                Host an Event with Us
              </h2>
              <p className="text-white/80 dark:text-brand-yellow/70 max-w-xl mx-auto mb-8">
                Interested in partnering for a screening or workshop? We&apos;d love to hear from you.
              </p>
              <a 
                href="mailto:hello@gboyinwa.com" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-yellow text-brand-black font-bold hover:bg-brand-yellow/90 transition-colors"
              >
                Get in Touch
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
