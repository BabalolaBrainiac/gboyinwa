import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getEvents } from '@/lib/events';
import { getPublishedPosts } from '@/lib/blog';
import { Calendar, MapPin, BookOpen, Archive, FileText, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function ArchivePage() {
  const [allEvents, allPosts] = await Promise.all([getEvents(), getPublishedPosts()]);

  const now = new Date();

  // Past events: have a start_date in the past
  const pastEvents = allEvents.filter(
    (e) => e.start_date && new Date(e.start_date) < now
  );

  // Upcoming events (not archived)
  const upcomingEvents = allEvents.filter(
    (e) => !e.start_date || new Date(e.start_date) >= now
  );

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-black">
      <Header />
      <main className="flex-1 pt-20">

        {/* Hero */}
        <section className="relative py-16 md:py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 yellow-fade-top pointer-events-none" />
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/15 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
              <Archive className="w-3.5 h-3.5" />
              Archive
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-3">
              Archive
            </h1>
            <p className="text-base text-brand-black/60 dark:text-brand-yellow/60 max-w-xl mx-auto">
              A record of past events, programs, letters, and documents from Gbóyinwá Media.
            </p>
          </div>
        </section>

        {/* Past Events */}
        <section className="px-4 pb-14">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-brand-green dark:bg-brand-yellow flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white dark:text-brand-black" />
              </div>
              <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow">Past Events</h2>
            </div>

            {pastEvents.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pastEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group glass-card overflow-hidden hover:border-brand-orange dark:hover:border-brand-yellow transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={event.image_url || '/images/logo-full.png'}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-0.5 rounded-full bg-brand-black/50 text-white text-xs font-medium">
                          Past
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-sm font-bold text-brand-black dark:text-brand-yellow mb-2 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-xs text-brand-black/50 dark:text-brand-yellow/50">
                        {event.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.start_date).toLocaleDateString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-8 text-center">
                <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
                  No past events yet. Check back after our upcoming events conclude.
                </p>
                <Link href="/events" className="inline-flex items-center gap-1 mt-3 text-sm text-brand-green dark:text-brand-yellow hover:underline">
                  View upcoming events
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Past Programs */}
        <section className="px-4 pb-14">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-brand-violet flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow">Past Programs</h2>
            </div>

            <div className="rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-8 text-center">
              <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50 mb-2">
                Program archives will appear here as programs conclude.
              </p>
              <Link href="/programs" className="inline-flex items-center gap-1 mt-1 text-sm text-brand-green dark:text-brand-yellow hover:underline">
                View active programs
              </Link>
            </div>
          </div>
        </section>

        {/* Past Letters */}
        <section className="px-4 pb-14">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow">Letters</h2>
            </div>

            {allPosts.length > 0 ? (
              <div className="space-y-3">
                {allPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/letters/${post.slug}`}
                    className="group flex items-center gap-4 p-4 rounded-xl glass-card hover:border-brand-orange dark:hover:border-brand-yellow transition-all"
                  >
                    {post.cover_url && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={post.cover_url}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-brand-black dark:text-brand-yellow group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors truncate">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 line-clamp-1 mt-0.5">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    {post.published_at && (
                      <span className="text-xs text-brand-black/40 dark:text-brand-yellow/40 shrink-0">
                        {new Date(post.published_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-8 text-center">
                <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50 mb-2">
                  No letters archived yet.
                </p>
                <Link href="/letters" className="inline-flex items-center gap-1 mt-1 text-sm text-brand-green dark:text-brand-yellow hover:underline">
                  Browse latest letters
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Documents */}
        <section className="px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-brand-yellow flex items-center justify-center">
                <FileText className="w-4 h-4 text-brand-black" />
              </div>
              <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow">Documents</h2>
            </div>

            <div className="rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-8 text-center">
              <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
                Public documents and reports will be listed here.
              </p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
