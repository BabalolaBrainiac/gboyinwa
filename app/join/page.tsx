import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { Briefcase, Heart, Handshake, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Join the Mission | Gbóyinwá Media',
  description: 'Join the Gbóyinwá mission — apply for a job, volunteer on a project, or partner and invest with us.',
};

const options = [
  {
    icon: Briefcase,
    href: '/join/hiring',
    label: 'Hiring',
    headline: 'Work with us',
    description:
      'Explore open roles at Gbóyinwá Media. We hire storytellers, producers, designers, and builders who believe in the power of authentic Nigerian narratives.',
    cta: 'View open roles',
    gradient: 'from-brand-green to-brand-violet',
  },
  {
    icon: Heart,
    href: '/join/volunteer',
    label: 'Volunteer',
    headline: 'Contribute your skills',
    description:
      'Lend your time and expertise to ongoing projects that need you. From production support to community outreach, there is a place for every committed artist and advocate.',
    cta: 'See open projects',
    gradient: 'from-brand-orange to-brand-yellow',
  },
  {
    icon: Handshake,
    href: '/join/partner',
    label: 'Partner & Invest',
    headline: 'Grow with us',
    description:
      'Partner with us to fund programs, co-produce content, or invest in the next generation of Nigerian storytellers. Let\'s build something lasting together.',
    cta: 'Explore partnership',
    gradient: 'from-brand-violet to-brand-green',
  },
];

export default function JoinPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-black">
      <Header />
      <main className="flex-1 pt-20">

        {/* Hero */}
        <section className="relative py-16 md:py-24 px-5 sm:px-8 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-yellow/5 dark:bg-brand-yellow/3 blur-[100px] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto text-center">
            <AnimateIn>
              <h1 className="text-4xl md:text-6xl font-bold text-brand-green dark:text-brand-yellow mb-4 leading-tight">
                Join the Mission
              </h1>
              <p className="text-lg text-brand-black/60 dark:text-brand-yellow/60 leading-relaxed mb-2">
                There are many ways to be part of the Gbóyinwá story.
              </p>
              <p className="text-sm font-medium italic text-brand-green/60 dark:text-brand-yellow/50">
                &hellip;for the artists, by the artists
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* Options */}
        <section className="px-5 sm:px-8 pb-20">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {options.map(({ icon: Icon, href, label, headline, description, cta, gradient }, i) => (
              <AnimateIn key={href} delay={i * 100}>
                <Link
                  href={href}
                  className="group flex flex-col h-full rounded-3xl overflow-hidden glass-card hover:border-brand-green/30 dark:hover:border-brand-yellow/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                  <div className="p-7 flex flex-col flex-1">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase text-brand-green/50 dark:text-brand-yellow/50 mb-1">
                      {label}
                    </span>
                    <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-3">
                      {headline}
                    </h2>
                    <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 leading-relaxed flex-1 mb-5">
                      {description}
                    </p>
                    <span className="inline-flex items-center text-brand-green dark:text-brand-yellow font-semibold text-sm">
                      {cta}
                      <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
