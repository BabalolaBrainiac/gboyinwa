import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getFeaturedEvent } from '@/lib/events';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function HomePage() {
  const featured = await getFeaturedEvent();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-brand-orange dark:text-brand-yellow mb-4">
                Documentary & Storytelling from Lagos
              </p>
              <h1 className="text-5xl md:text-7xl font-bold text-brand-green dark:text-brand-yellow mb-6 leading-[1.1]">
                gbóyinwá
              </h1>
              <p className="text-lg text-brand-black/70 dark:text-brand-yellow/70 mb-8 leading-relaxed">
                Amplifying authentic voices and hidden narratives. We invest in the next generation of Nigerian storytellers.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/events" className="btn-primary">
                  Explore Events
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link href="/team" className="btn-secondary">
                  Meet the Team
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Gbóyindé Grant Featured Section */}
        <section className="py-20 px-4 bg-brand-green dark:bg-black">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow text-sm font-medium mb-4">
                  Featured Grant
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  The Gbóyindé Grant
                </h2>
                <p className="text-xl text-brand-yellow/80 mb-4">
                  Magic in Èkó Grey
                </p>
                <p className="text-white/70 mb-8 leading-relaxed">
                  A transformative initiative investing in Nigeria&apos;s emerging documentary film talent. 
                  Funding five exceptional young filmmakers with ₦6,000,000 each to create 
                  compelling short documentaries exploring everyday Lagos life.
                </p>
                <Link 
                  href="/events/gboyinde-grant-young-documentary-filmmakers" 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-yellow text-brand-black font-semibold hover:bg-brand-yellow/90 transition-colors"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-white mb-1">₦55M</div>
                  <div className="text-white/50 text-sm">Total Funding</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-white mb-1">5</div>
                  <div className="text-white/50 text-sm">Filmmakers</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-white mb-1">₦6M</div>
                  <div className="text-white/50 text-sm">Per Grant</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-white mb-1">10+</div>
                  <div className="text-white/50 text-sm">Festivals</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Documentary Excellence',
                  desc: 'Professional-grade production support for authentic storytelling that preserves cultural heritage.',
                },
                {
                  title: 'Creative Empowerment',
                  desc: 'Nurturing young Nigerian filmmakers aged 16-35 with funding and mentorship.',
                },
                {
                  title: 'Global Storytelling',
                  desc: 'Taking authentic Lagos narratives to international film festivals and audiences worldwide.',
                },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10">
                  <h3 className="text-lg font-bold text-brand-green dark:text-brand-yellow mb-2">
                    {item.title}
                  </h3>
                  <p className="text-brand-black/60 dark:text-brand-yellow/60 text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Event */}
        {featured && (
          <section className="py-20 px-4 bg-brand-yellow/5 dark:bg-brand-yellow/5">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-8">
                Upcoming Event
              </h2>
              <Link
                href={`/events/${featured.slug}`}
                className="group block rounded-2xl overflow-hidden border border-brand-green/10 dark:border-brand-yellow/10 bg-white dark:bg-brand-black/50 hover:border-brand-orange dark:hover:border-brand-yellow transition-colors"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4 text-sm text-brand-black/50 dark:text-brand-yellow/50">
                      {featured.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(featured.start_date).toLocaleDateString('en-NG', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      )}
                      {featured.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {featured.location}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-brand-black dark:text-brand-yellow mb-2 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                      {featured.title}
                    </h3>
                    {featured.summary && (
                      <p className="text-brand-black/60 dark:text-brand-yellow/60 line-clamp-2">
                        {featured.summary}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
