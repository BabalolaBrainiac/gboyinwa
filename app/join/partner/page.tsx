import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { ArrowLeft, Handshake, Mail, TrendingUp, Globe, Users, Clapperboard } from 'lucide-react';

export const metadata = {
  title: 'Partner & Invest | Gbóyinwá Media',
  description: 'Partner with or invest in Gbóyinwá Media — co-produce, fund programs, or build with us.',
};

const partnershipTypes = [
  {
    icon: TrendingUp,
    title: 'Investment',
    description:
      'Invest in Gbóyinwá Media\'s growth. We welcome investors who align with our mission to build a lasting institution for authentic Nigerian storytelling.',
  },
  {
    icon: Clapperboard,
    title: 'Co-Production',
    description:
      'Partner with us to co-produce documentary films and series. Bring your resources and reach; we bring the vision, community trust, and storytelling expertise.',
  },
  {
    icon: Globe,
    title: 'Distribution & Festivals',
    description:
      'Help us take Gbóyinwá films to international audiences. We seek distribution partners, festival programmers, and platform partnerships.',
  },
  {
    icon: Users,
    title: 'Program Sponsorship',
    description:
      'Sponsor a grant cycle, a workshop series, or a specific program. Your support directly funds young Nigerian filmmakers.',
  },
];

export default function PartnerPage() {
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
                <Handshake className="w-3.5 h-3.5" />
                Partner &amp; Invest
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-4">
                Grow with Us
              </h1>
              <p className="text-base text-brand-black/60 dark:text-brand-yellow/60 max-w-xl leading-relaxed">
                We are building an institution. If you share our belief in authentic African storytelling,
                we would love to explore what we can build together — as funders, co-producers,
                distribution partners, or sponsors.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* Partnership types */}
        <section className="px-5 sm:px-8 pb-12">
          <div className="max-w-4xl mx-auto">
            <AnimateIn>
              <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-6">
                Ways to Partner
              </h2>
            </AnimateIn>
            <div className="grid md:grid-cols-2 gap-5">
              {partnershipTypes.map(({ icon: Icon, title, description }, i) => (
                <AnimateIn key={i} delay={i * 80}>
                  <div className="glass-card rounded-2xl p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-brand-violet/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-brand-violet" />
                    </div>
                    <h3 className="font-bold text-brand-green dark:text-brand-yellow mb-2">{title}</h3>
                    <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 leading-relaxed">{description}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 sm:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            <AnimateIn>
              <div className="relative rounded-3xl overflow-hidden bg-brand-green dark:bg-[#060f06]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-brand-yellow/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent" />
                <div className="relative px-8 py-10 md:px-12 md:py-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Start a conversation
                  </h2>
                  <p className="text-white/65 max-w-md mb-6 text-sm leading-relaxed">
                    Send us a brief note introducing yourself or your organisation, the kind of
                    partnership you have in mind, and the best way to reach you. We will respond
                    within one week.
                  </p>
                  <a
                    href="mailto:hello@gboyinwa.com?subject=Partnership Enquiry"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-yellow text-brand-black font-bold text-sm hover:bg-brand-yellow/90 active:scale-[0.98] transition-all shadow-lg shadow-brand-yellow/20"
                  >
                    <Mail className="w-4 h-4" />
                    hello@gboyinwa.com
                  </a>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
