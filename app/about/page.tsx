import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { Eye, Target, Heart, ArrowRight, Users, Sparkles, Fingerprint, DoorOpen } from 'lucide-react';

export const metadata = {
  title: 'About | Gbóyinwá Media',
  description: 'Learn about Gbóyinwá Media — our vision, mission, and the values that drive our work.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-black">
      <Header />
      <main className="flex-1 pt-20">

        {/* Hero */}
        <section className="relative py-16 md:py-24 px-5 sm:px-8 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-yellow/5 dark:bg-brand-yellow/3 blur-[100px] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto text-center">
            <AnimateIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/12 dark:bg-brand-yellow/8 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-5">
                <Heart className="w-3.5 h-3.5" />
                Who We Are
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-brand-green dark:text-brand-yellow mb-6 leading-tight">
                About Gbóyinwá Media
              </h1>
              <p className="text-lg text-brand-black/60 dark:text-brand-yellow/60 leading-relaxed mb-4">
                We are a Lagos-based company fashioning a beautiful world led by artists.
              </p>
              <p className="text-sm font-medium italic text-brand-green/60 dark:text-brand-yellow/50">
                &hellip;for artists, by artists
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="px-5 sm:px-8 pb-16 md:pb-24">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

            {/* Vision */}
            <AnimateIn>
              <div className="relative rounded-3xl overflow-hidden bg-brand-green dark:bg-[#060f06] p-8 md:p-10 h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-brand-yellow/20 flex items-center justify-center mb-5">
                    <Eye className="w-6 h-6 text-brand-yellow" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-bold tracking-widest uppercase mb-3">
                    Our Vision
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug">
                    To create a company devoted to the needs of the artist in the shaping of a beautiful world.
                  </h2>
                </div>
              </div>
            </AnimateIn>

            {/* Mission */}
            <AnimateIn delay={100}>
              <div className="relative rounded-3xl overflow-hidden border border-brand-green/15 dark:border-brand-yellow/15 bg-white dark:bg-brand-black p-8 md:p-10 h-full">
                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-green/3 dark:bg-brand-yellow/3 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center mb-5">
                    <Target className="w-6 h-6 text-brand-green dark:text-brand-yellow" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-3">
                    Our Mission
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-brand-green dark:text-brand-yellow mb-4 leading-snug">
                    We strive to meet every artist at the point of their need.
                  </h2>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* Values */}
        <section className="px-5 sm:px-8 pb-16 md:pb-24">
          <div className="max-w-5xl mx-auto">
            <AnimateIn className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full bg-brand-green/8 dark:bg-brand-yellow/8 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-3">
                What Drives Us
              </span>
              <h2 className="text-3xl font-bold text-brand-green dark:text-brand-yellow">
                Our Values
              </h2>
            </AnimateIn>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  icon: Sparkles,
                  title: 'Beauty',
                  desc: 'We believe artists are at the forefront of the creation of a beautiful world for all.',
                },
                {
                  icon: Users,
                  title: 'Community',
                  desc: 'We believe in building a lattice of artists who inspire other artists.',
                },
                {
                  icon: Fingerprint,
                  title: 'Authenticity',
                  desc: 'We believe in art born from the original perspective of the artist.',
                },
                {
                  icon: DoorOpen,
                  title: 'Access',
                  desc: 'We believe that beautiful art can and should be made and enjoyed by all.',
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <AnimateIn key={i} delay={i * 100}>
                  <div className="glass-card rounded-2xl p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-brand-green/8 dark:bg-brand-yellow/8 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-brand-green dark:text-brand-yellow" />
                    </div>
                    <h3 className="font-bold text-brand-green dark:text-brand-yellow mb-2">{title}</h3>
                    <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 leading-relaxed">{desc}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 sm:px-8 pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <AnimateIn>
              <h2 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-3">
                Ready to be part of the story?
              </h2>
              <p className="text-sm text-brand-black/55 dark:text-brand-yellow/55 mb-6">
                Whether you&apos;re an artist, a volunteer, or a potential partner, there&apos;s a place for you in our mission.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-green/20 dark:shadow-brand-yellow/10"
                >
                  Join the Mission
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-brand-green/20 dark:border-brand-yellow/20 text-brand-green dark:text-brand-yellow font-bold text-sm hover:border-brand-green dark:hover:border-brand-yellow transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </AnimateIn>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
