import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { JoinMovement } from '@/components/join-movement';
import { getFeaturedEvent } from '@/lib/events';
import {
  ArrowRight, Sparkles, Play, Users, Globe,
  Clapperboard, Camera, Palette, Trophy, Calendar, MapPin,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function HomePage() {
  const featured = await getFeaturedEvent();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-black">
      <Header />
      <main className="flex-1">

        {/* ─── HERO ─── */}
        <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
          {/* Glow blobs */}
          <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-brand-yellow/6 dark:bg-brand-yellow/4 blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-violet/8 dark:bg-brand-violet/6 blur-[120px] pointer-events-none" />

          {/* Giant watermark logomark */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[520px] h-[520px] opacity-[0.035] dark:opacity-[0.055] pointer-events-none select-none hidden lg:block">
            <Image src="/images/logomark.png" alt="" fill className="object-contain" sizes="520px" priority />
          </div>

          <div className="relative w-full max-w-6xl mx-auto px-5 sm:px-8 py-28 md:py-36">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left: text */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/15 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-8 animate-fade-in">
                  <Sparkles className="w-3.5 h-3.5" />
                  Documentary & Storytelling from Lagos
                </div>

                <h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold text-brand-green dark:text-brand-yellow leading-[0.88] mb-6 animate-fade-in-up">
                  gbóyinwá
                </h1>

                <p className="text-lg md:text-xl text-brand-black/60 dark:text-brand-yellow/60 mb-10 max-w-md leading-relaxed animate-fade-in-up animate-delay-200">
                  Amplifying authentic voices and hidden narratives. We invest in the next generation of Nigerian storytellers.
                </p>

                <div className="flex flex-wrap gap-4 animate-fade-in-up animate-delay-300">
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-green/20 dark:shadow-brand-yellow/10"
                  >
                    Explore Events
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/team"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-brand-green/20 dark:border-brand-yellow/20 text-brand-green dark:text-brand-yellow font-bold text-sm hover:border-brand-green dark:hover:border-brand-yellow transition-all"
                  >
                    Meet the Team
                  </Link>
                </div>
              </div>

              {/* Right: floating stats */}
              <div className="relative h-[460px] hidden lg:block animate-fade-in animate-delay-200">
                {/* Center floating card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 animate-float">
                  <div className="w-full h-full rounded-3xl bg-gradient-to-br from-brand-green to-brand-violet p-[2px] shadow-2xl shadow-brand-green/25">
                    <div className="w-full h-full rounded-3xl bg-white dark:bg-brand-black flex flex-col items-center justify-center gap-3">
                      <div className="relative w-20 h-20">
                        <Image src="/images/logomark.png" alt="Gbóyinwá" fill className="object-contain dark:hidden" sizes="80px" />
                        <Image src="/images/logomark-yellow.png" alt="Gbóyinwá" fill className="object-contain hidden dark:block" sizes="80px" />
                      </div>
                      <span className="text-sm font-bold text-brand-green dark:text-brand-yellow">gbóyinwá</span>
                      <span className="text-xs text-brand-black/40 dark:text-brand-yellow/40 font-medium">Media</span>
                    </div>
                  </div>
                </div>

                {/* Films Funded */}
                <div className="absolute top-0 right-2 w-44 animate-fade-in-up animate-delay-200">
                  <div className="bg-white dark:bg-[#111] rounded-2xl p-5 shadow-xl border border-brand-green/8 dark:border-brand-yellow/8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                        <Clapperboard className="w-5 h-5 text-brand-orange" />
                      </div>
                      <span className="text-3xl font-bold text-brand-green dark:text-brand-yellow">5</span>
                    </div>
                    <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 font-semibold">Films Funded</p>
                    <div className="mt-3 h-1.5 bg-brand-green/10 dark:bg-brand-yellow/10 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-brand-yellow to-brand-orange rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Youth Empowerment */}
                <div className="absolute bottom-2 left-0 w-48 animate-fade-in-up animate-delay-300">
                  <div className="bg-white dark:bg-[#111] rounded-2xl p-5 shadow-xl border border-brand-green/8 dark:border-brand-yellow/8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 rounded-xl bg-brand-violet/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-brand-violet" />
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-brand-green dark:text-brand-yellow">16-35</span>
                        <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40">years</p>
                      </div>
                    </div>
                    <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 font-semibold">Youth Empowerment</p>
                    <div className="mt-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-brand-violet" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trophy badge */}
                <div className="absolute bottom-24 right-0 animate-bounce-subtle">
                  <div className="w-20 h-20 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg shadow-brand-yellow/30">
                    <div className="text-center">
                      <Trophy className="w-6 h-6 text-brand-black mx-auto" />
                      <span className="text-[10px] font-bold text-brand-black block">₦55M</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── GBÓYINDÉ GRANT ─── */}
        <section className="relative bg-brand-green dark:bg-[#060f06] overflow-hidden">
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-brand-yellow/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-brand-violet/8 rounded-full blur-3xl pointer-events-none" />
          {/* Decorative logotype */}
          <div className="absolute bottom-4 right-4 w-40 h-20 opacity-[0.06] pointer-events-none hidden lg:block">
            <Image src="/images/logotype.png" alt="" fill className="object-contain object-right-bottom" sizes="160px" />
          </div>

          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-36">
            <AnimateIn>
              <div className="grid lg:grid-cols-2 gap-14 items-center">
                <div className="order-2 lg:order-1">
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group">
                    <Image
                      src="/images/logo-full.png"
                      alt="The Gbóyindé Grant"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width:1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/75 via-brand-black/15 to-transparent" />
                    <div className="absolute bottom-5 left-5">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow text-brand-black text-sm font-bold">
                        <Trophy className="w-4 h-4" />
                        ₦55M Total Funding
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-bold tracking-widest uppercase mb-6">
                    Featured Initiative
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
                    The Gbóyindé Grant
                  </h2>
                  <p className="text-xl text-brand-yellow/80 mb-5 font-light italic">
                    &ldquo;Magic in Èkó Grey&rdquo;
                  </p>
                  <p className="text-white/65 mb-8 leading-relaxed">
                    A transformative initiative to invest in Nigeria&apos;s emerging documentary film talent.
                    We&apos;re funding five exceptional young filmmakers with ₦6,000,000 each to create
                    compelling short documentaries exploring the hidden magic of everyday Lagos life.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {[
                      { value: '₦6M', label: 'per filmmaker', icon: Camera },
                      { value: '5', label: 'filmmakers', icon: Users },
                      { value: '10+', label: 'film festivals', icon: Globe },
                      { value: '9', label: 'months timeline', icon: Calendar },
                    ].map(({ value, label, icon: Icon }, i) => (
                      <div
                        key={i}
                        className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 hover:border-brand-yellow/30 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-brand-yellow mb-2" />
                        <div className="text-2xl font-bold text-white">{value}</div>
                        <div className="text-xs text-white/50 font-medium">{label}</div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/events/gboyinde-grant-young-documentary-filmmakers"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-yellow text-brand-black font-bold text-sm hover:bg-brand-yellow/90 active:scale-[0.98] transition-all shadow-lg shadow-brand-yellow/20"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ─── OUR MISSION ─── */}
        <section className="section-padding">
          <div className="max-w-6xl mx-auto">
            <AnimateIn className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-brand-green/8 dark:bg-brand-yellow/8 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
                Our Mission
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-4">
                Preserving Stories,<br />Empowering Voices
              </h2>
              <p className="text-brand-black/50 dark:text-brand-yellow/50 max-w-xl mx-auto leading-relaxed">
                We believe in the transformative power of documentary filmmaking to capture truth,
                celebrate culture, and inspire change.
              </p>
            </AnimateIn>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Camera,
                  title: 'Documentary Excellence',
                  desc: 'Professional-grade production support for authentic storytelling that preserves cultural heritage and captures raw, unfiltered truth.',
                  gradient: 'from-brand-orange to-brand-yellow',
                },
                {
                  icon: Palette,
                  title: 'Creative Empowerment',
                  desc: 'Nurturing young Nigerian filmmakers aged 16-35 with funding, mentorship, and platforms to bring their artistic visions to life.',
                  gradient: 'from-brand-violet to-brand-green',
                },
                {
                  icon: Globe,
                  title: 'Global Storytelling',
                  desc: 'Taking authentic Lagos narratives to international film festivals, streaming platforms, and audiences worldwide.',
                  gradient: 'from-brand-green to-brand-yellow',
                },
              ].map(({ icon: Icon, title, desc, gradient }, i) => (
                <AnimateIn key={i} delay={i * 120}>
                  <div className="group relative rounded-3xl bg-brand-black/2 dark:bg-white/2 border border-brand-black/8 dark:border-white/8 p-8 overflow-hidden hover:border-transparent hover:shadow-2xl hover:shadow-brand-green/8 dark:hover:shadow-brand-yellow/4 transition-all duration-500 h-full">
                    {/* Gradient border reveal */}
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
                    <div className="absolute inset-[1px] rounded-[22px] bg-white dark:bg-brand-black transition-all duration-500" />

                    <div className="relative z-10">
                      {/* Film frame corners */}
                      <div className="absolute top-0 right-0 w-10 h-10 opacity-8 group-hover:opacity-20 transition-opacity">
                        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full text-brand-green dark:text-brand-yellow">
                          <rect x="28" y="0" width="12" height="12" rx="2" fill="currentColor" />
                          <rect x="28" y="28" width="12" height="12" rx="2" fill="currentColor" />
                          <rect x="0" y="0" width="12" height="12" rx="2" fill="currentColor" />
                          <rect x="0" y="28" width="12" height="12" rx="2" fill="currentColor" />
                        </svg>
                      </div>

                      <div className="w-14 h-14 mb-6 rounded-2xl bg-brand-green/8 dark:bg-brand-yellow/8 group-hover:bg-brand-green/15 dark:group-hover:bg-brand-yellow/15 flex items-center justify-center transition-colors duration-300">
                        <Icon className="w-7 h-7 text-brand-green dark:text-brand-yellow" />
                      </div>

                      <h3 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-3">
                        {title}
                      </h3>
                      <p className="text-brand-black/60 dark:text-brand-yellow/60 leading-relaxed text-sm">
                        {desc}
                      </p>

                      <div className={`mt-6 h-0.5 w-0 group-hover:w-14 bg-gradient-to-r ${gradient} transition-all duration-500 rounded-full`} />
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ─── UPCOMING EVENT ─── */}
        {featured && (
          <section className="section-padding pt-0">
            <div className="max-w-6xl mx-auto">
              <AnimateIn>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green dark:bg-brand-yellow flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white dark:text-brand-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-brand-green dark:text-brand-yellow">Upcoming Event</h2>
                    <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">Save the date</p>
                  </div>
                </div>

                <Link
                  href={`/events/${featured.slug}`}
                  className="group block rounded-3xl overflow-hidden bg-white dark:bg-brand-black/50 border border-brand-green/10 dark:border-brand-yellow/10 hover:border-brand-orange dark:hover:border-brand-yellow transition-all duration-300 hover:shadow-2xl hover:shadow-brand-green/8"
                >
                  <div className="grid md:grid-cols-5 gap-0">
                    <div className="md:col-span-2 relative aspect-video md:aspect-auto md:min-h-[300px]">
                      <Image
                        src={featured.image_url || '/images/logo-full.png'}
                        alt={featured.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 40vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white dark:to-brand-black opacity-0 md:opacity-100" />
                    </div>
                    <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        {featured.start_date && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-sm font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(featured.start_date).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {featured.location && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-orange/10 text-brand-orange text-sm font-semibold">
                            <MapPin className="w-3.5 h-3.5" />
                            {featured.location}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-brand-black dark:text-brand-yellow mb-3 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                        {featured.title}
                      </h3>
                      {featured.summary && (
                        <p className="text-brand-black/60 dark:text-brand-yellow/60 mb-5 line-clamp-2 text-sm leading-relaxed">
                          {featured.summary}
                        </p>
                      )}
                      <span className="inline-flex items-center text-brand-green dark:text-brand-yellow font-semibold text-sm">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimateIn>
            </div>
          </section>
        )}

        {/* ─── JOIN THE MOVEMENT (client component — has contact modal) ─── */}
        <JoinMovement />

      </main>
      <Footer />
    </div>
  );
}
