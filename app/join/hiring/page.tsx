import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { ArrowLeft, Briefcase, Mail, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Hiring | Gbóyinwá Media',
  description: 'Open roles at Gbóyinwá Media. Join our team of storytellers, producers, and builders.',
};

// Update this list as roles open and close
const openRoles: {
  title: string;
  type: string;
  department: string;
  description: string;
}[] = [
  // Example:
  // {
  //   title: 'Documentary Producer',
  //   type: 'Full-time',
  //   department: 'Production',
  //   description: 'Lead production on grant-funded documentary films from pre- to post-production.',
  // },
];

export default function HiringPage() {
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
                <Briefcase className="w-3.5 h-3.5" />
                Hiring
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-4">
                Work with Us
              </h1>
              <p className="text-base text-brand-black/60 dark:text-brand-yellow/60 max-w-xl leading-relaxed">
                We hire storytellers, producers, designers, community managers, and builders who believe
                in the transformative power of authentic Nigerian narratives. If that&apos;s you, we&apos;d love to meet you.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* How to Apply */}
        <section className="px-5 sm:px-8 pb-10">
          <div className="max-w-4xl mx-auto">
            <AnimateIn>
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <h2 className="text-lg font-bold text-brand-green dark:text-brand-yellow mb-3">
                  How to Apply
                </h2>
                <ol className="space-y-3 text-sm text-brand-black/70 dark:text-brand-yellow/70 list-none">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Review the open roles below. If your skills align with our work even without a listed role, we still want to hear from you.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Send a short introduction, your CV or portfolio, and a note on what role you&apos;re interested in to <a href="mailto:hello@gboyinwa.com?subject=Job Application" className="text-brand-green dark:text-brand-yellow underline underline-offset-2">hello@gboyinwa.com</a> with the subject line <strong>&quot;Job Application – [Role Name]&quot;</strong>.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>Our team reviews every application and will respond within two weeks.</span>
                  </li>
                </ol>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* Open Roles */}
        <section className="px-5 sm:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-6">
              Open Roles
            </h2>

            {openRoles.length > 0 ? (
              <div className="space-y-4">
                {openRoles.map((role, i) => (
                  <AnimateIn key={i} delay={i * 80}>
                    <div className="glass-card rounded-2xl p-6 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-semibold">
                            {role.department}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-semibold">
                            {role.type}
                          </span>
                        </div>
                        <h3 className="font-bold text-brand-black dark:text-brand-yellow">{role.title}</h3>
                        <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 mt-1 leading-relaxed">
                          {role.description}
                        </p>
                      </div>
                      <a
                        href={`mailto:hello@gboyinwa.com?subject=Job Application – ${encodeURIComponent(role.title)}`}
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black text-sm font-semibold hover:opacity-90 transition-all"
                      >
                        Apply
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            ) : (
              <AnimateIn>
                <div className="rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-green/8 dark:bg-brand-yellow/8 flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-brand-green dark:text-brand-yellow" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-green dark:text-brand-yellow mb-2">
                    No open roles right now
                  </h3>
                  <p className="text-sm text-brand-black/55 dark:text-brand-yellow/55 max-w-sm mx-auto mb-6">
                    We&apos;re not actively hiring at the moment, but we always welcome introductions from talented people.
                    Send us a note and we&apos;ll keep you in mind.
                  </p>
                  <a
                    href="mailto:hello@gboyinwa.com?subject=Open Application"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Send an open application
                  </a>
                </div>
              </AnimateIn>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
