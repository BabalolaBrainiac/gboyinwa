import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getEventBySlug } from '@/lib/events';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Share2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const isGrantEvent = slug.includes('gboyinde') || slug.includes('grant');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          {/* Background Image */}
          <div className="relative w-full h-[50vh] md:h-[60vh]">
            <Image
              src={event.image_url || '/images/logo-full.png'}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/50 to-transparent" />
          </div>
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-6xl mx-auto px-4 pb-12">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Events
              </Link>
              
              {isGrantEvent && (
                <span className="inline-block px-4 py-1 rounded-full bg-brand-yellow text-brand-black text-sm font-bold mb-4">
                  Featured Grant
                </span>
              )}
              
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-3xl">
                {event.title}
              </h1>
              
              <div className="flex flex-wrap gap-4 text-white/80">
                {event.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-5 h-5" />
                    {new Date(event.start_date).toLocaleDateString('en-NG', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-5 h-5" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Event Details */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {event.summary && (
                  <p className="text-xl text-brand-black/80 dark:text-brand-yellow/80 mb-8 font-medium leading-relaxed">
                    {event.summary}
                  </p>
                )}
                
                {event.description && (
                  <div className="prose dark:prose-invert prose-lg max-w-none text-brand-black/80 dark:text-brand-yellow/80 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </div>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Event Info Card */}
                <div className="card p-6">
                  <h3 className="font-bold text-brand-green dark:text-brand-yellow mb-4">
                    Event Details
                  </h3>
                  <div className="space-y-4">
                    {event.start_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-brand-orange dark:text-brand-yellow mt-0.5" />
                        <div>
                          <p className="font-medium text-brand-black dark:text-brand-yellow">Date</p>
                          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                            {new Date(event.start_date).toLocaleDateString('en-NG', { 
                              dateStyle: 'full' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.end_date && event.end_date !== event.start_date && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-brand-orange dark:text-brand-yellow mt-0.5" />
                        <div>
                          <p className="font-medium text-brand-black dark:text-brand-yellow">End Date</p>
                          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                            {new Date(event.end_date).toLocaleDateString('en-NG', { 
                              dateStyle: 'full' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-brand-orange dark:text-brand-yellow mt-0.5" />
                        <div>
                          <p className="font-medium text-brand-black dark:text-brand-yellow">Location</p>
                          <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">
                            {event.location}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* CTA Card */}
                {isGrantEvent && (
                  <div className="card p-6 bg-gradient-to-br from-brand-green to-brand-violet text-white">
                    <h3 className="font-bold text-white mb-2">
                      Apply for the Grant
                    </h3>
                    <p className="text-white/80 text-sm mb-4">
                      Young filmmakers aged 16-35 can apply for funding to create documentary films about Lagos.
                    </p>
                    <a 
                      href="mailto:hello@gboyinwa.com?subject=Gbóyindé Grant Application"
                      className="block w-full py-3 px-4 rounded-xl bg-brand-yellow text-brand-black text-center font-bold hover:bg-brand-yellow/90 transition-colors"
                    >
                      Apply Now
                    </a>
                  </div>
                )}
                
                {/* Share Card */}
                <div className="card p-6">
                  <h3 className="font-bold text-brand-green dark:text-brand-yellow mb-4">
                    Share Event
                  </h3>
                  <button 
                    className="flex items-center gap-2 text-brand-green dark:text-brand-yellow hover:underline"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.share?.({ title: event.title, url: window.location.href }).catch(() => {});
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share with friends
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
