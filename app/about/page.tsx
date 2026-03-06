import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimateIn } from '@/components/animate-in';
import { 
  Camera, Heart, Globe, Users, Award, Sparkles,
  Target, Lightbulb, ArrowRight, MapPin, Calendar
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'About Us | Gbóyinwá',
  description: 'Learn about Gbóyinwá Media - amplifying authentic Nigerian voices through documentary storytelling.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-black">
      <Header />
      <main className="flex-1">
        
        {/* Hero with Yellow Fade */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden">
          {/* Yellow fade gradient at top */}
          <div className="absolute inset-0 yellow-fade-top pointer-events-none" />
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Giant watermark */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none hidden lg:block">
            <Image src="/images/logomark.png" alt="" fill className="object-contain" sizes="350px" />
          </div>

          <div className="relative w-full max-w-6xl mx-auto px-5 sm:px-8 py-20 md:py-28">
            <div className="max-w-3xl">
              <AnimateIn>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/15 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  About Gbóyinwá
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-brand-green dark:text-brand-yellow leading-[1.1] mb-6">
                  Amplifying Authentic Voices from Lagos
                </h1>
                
                <p className="text-lg text-brand-black/60 dark:text-brand-yellow/60 leading-relaxed max-w-2xl">
                  Gbóyinwá Media is a Lagos-based documentary and storytelling initiative 
                  dedicated to preserving Nigerian culture, empowering young filmmakers, 
                  and sharing authentic narratives with the world.
                </p>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <AnimateIn>
                <div className="relative">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                    <Image
                      src="/images/logo-full.png"
                      alt="Gbóyinwá Media"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -bottom-4 -right-4 md:bottom-6 md:right-6 glass-card rounded-xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-yellow flex items-center justify-center">
                        <Heart className="w-6 h-6 text-brand-black" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-brand-green dark:text-brand-yellow">100%</div>
                        <div className="text-xs text-brand-black/50 dark:text-brand-yellow/50">Passion Driven</div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateIn>

              <AnimateIn delay={100}>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-green/8 dark:bg-brand-yellow/8 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
                    Our Story
                  </span>
                  <h2 className="text-3xl font-bold text-brand-green dark:text-brand-yellow mb-4">
                    Born from a Love of Storytelling
                  </h2>
                  <div className="space-y-4 text-brand-black/60 dark:text-brand-yellow/60 leading-relaxed">
                    <p>
                      Gbóyinwá was founded with a simple belief: that every community has stories 
                      worth telling, and every young filmmaker deserves the opportunity to tell them.
                    </p>
                    <p>
                      Our name, drawn from Yoruba roots, reflects our commitment to listening—
                      to hearing the voices that often go unheard and amplifying them through 
                      the power of documentary film.
                    </p>
                    <p>
                      Based in Lagos, the heartbeat of Nigerian creativity, we work at the 
                      intersection of culture, art, and social impact. Our flagship initiative, 
                      The Gbóyindé Grant, provides funding and mentorship to emerging filmmakers 
                      aged 16-35, helping them bring their visions to life.
                    </p>
                  </div>
                </div>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="section-padding bg-brand-green dark:bg-[#060f06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <AnimateIn className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
                What We Do
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Our Initiatives
              </h2>
              <p className="text-white/60 max-w-xl mx-auto text-sm">
                We combine funding, mentorship, and production support to create 
                a thriving ecosystem for documentary filmmaking in Nigeria.
              </p>
            </AnimateIn>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: Award,
                  title: 'The Gbóyindé Grant',
                  desc: '₦55 million in funding for 5 emerging filmmakers to create short documentaries about Lagos life.',
                  color: 'brand-yellow',
                },
                {
                  icon: Users,
                  title: 'Mentorship Program',
                  desc: 'Connecting young filmmakers with industry professionals for guidance and career development.',
                  color: 'brand-orange',
                },
                {
                  icon: Camera,
                  title: 'Production Support',
                  desc: 'Technical assistance, equipment access, and post-production resources for grant recipients.',
                  color: 'brand-violet',
                },
              ].map(({ icon: Icon, title, desc, color }, i) => (
                <AnimateIn key={i} delay={i * 100}>
                  <div className="glass-card rounded-2xl p-6 h-full hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                    <div className={`w-12 h-12 rounded-xl bg-${color}/20 flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 text-${color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section-padding">
          <div className="max-w-6xl mx-auto">
            <AnimateIn className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full bg-brand-green/8 dark:bg-brand-yellow/8 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
                Our Values
              </span>
              <h2 className="text-3xl font-bold text-brand-green dark:text-brand-yellow mb-3">
                What Drives Us
              </h2>
            </AnimateIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Heart,
                  title: 'Authenticity',
                  desc: 'We believe in genuine storytelling that honors the truth of every narrative.',
                },
                {
                  icon: Target,
                  title: 'Impact',
                  desc: 'Every project we support aims to create meaningful change in communities.',
                },
                {
                  icon: Lightbulb,
                  title: 'Innovation',
                  desc: 'We embrace new perspectives and creative approaches to documentary film.',
                },
                {
                  icon: Globe,
                  title: 'Global Reach',
                  desc: 'Local stories with universal resonance, shared with audiences worldwide.',
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <AnimateIn key={i} delay={i * 80}>
                  <div className="glass-card rounded-2xl p-5 text-center h-full hover:border-brand-green/20 dark:hover:border-brand-yellow/20 transition-all duration-300 hover:-translate-y-1">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-green dark:text-brand-yellow" />
                    </div>
                    <h3 className="text-sm font-bold text-brand-green dark:text-brand-yellow mb-2">{title}</h3>
                    <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50 leading-relaxed">{desc}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="section-padding bg-gradient-to-br from-brand-yellow/5 via-transparent to-brand-violet/5">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card rounded-3xl p-8 md:p-12">
              <AnimateIn className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-brand-green dark:text-brand-yellow mb-2">
                  Our Impact
                </h2>
                <p className="text-brand-black/50 dark:text-brand-yellow/50 text-sm">
                  The numbers behind our commitment to Nigerian storytelling
                </p>
              </AnimateIn>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { value: '₦55M', label: 'Total Funding', color: 'brand-yellow' },
                  { value: '5', label: 'Filmmakers Funded', color: 'brand-green' },
                  { value: '16-35', label: 'Youth Age Range', color: 'brand-violet' },
                  { value: '10+', label: 'Film Festivals', color: 'brand-orange' },
                ].map(({ value, label, color }, i) => (
                  <AnimateIn key={i} delay={i * 100}>
                    <div className="text-center">
                      <div className={`text-3xl md:text-4xl font-bold text-${color} mb-1`}>{value}</div>
                      <div className="text-xs text-brand-black/50 dark:text-brand-yellow/50 uppercase tracking-wider">{label}</div>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding pb-20">
          <div className="max-w-4xl mx-auto">
            <AnimateIn>
              <div className="relative rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-green via-brand-violet to-brand-orange" />
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                  backgroundSize: '32px 32px'
                }} />
                
                <div className="relative px-6 py-10 md:px-12 md:py-12 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Be Part of Our Story
                  </h2>
                  <p className="text-white/70 max-w-md mx-auto mb-6 text-sm">
                    Whether you&apos;re a filmmaker, partner, or supporter, there&apos;s a place for you 
                    in the Gbóyinwá community.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link 
                      href="/events" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-green font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all"
                    >
                      <Calendar className="w-4 h-4" />
                      Explore Events
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link 
                      href="/contact" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/20 active:scale-[0.98] transition-all"
                    >
                      <MapPin className="w-4 h-4" />
                      Get in Touch
                    </Link>
                  </div>
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
