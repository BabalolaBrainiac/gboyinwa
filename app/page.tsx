import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getFeaturedEvent } from '@/lib/events';
import { ArrowRight, Sparkles, Play, Users, Globe, Clapperboard, Camera, Palette, Trophy, Calendar, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function HomePage() {
  const featured = await getFeaturedEvent();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/10 via-white to-brand-orange/5 dark:from-brand-green/20 dark:via-brand-black dark:to-brand-violet/10" />
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-brand opacity-5 dark:opacity-10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-violet/10 rounded-full blur-3xl" />
          
          <div className="relative w-full section-padding">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/20 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-sm font-medium mb-8">
                    <Sparkles className="w-4 h-4" />
                    Documentary & Storytelling from Lagos
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold text-brand-green dark:text-brand-yellow mb-6 leading-[1.1]">
                    gbóyinwá
                  </h1>
                  <p className="text-xl text-brand-black/80 dark:text-brand-yellow/80 mb-8 max-w-lg leading-relaxed">
                    Amplifying authentic voices and hidden narratives. We invest in the next generation of Nigerian storytellers.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/events" className="btn-primary text-lg px-8">
                      Explore Events
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                    <Link href="/team" className="btn-secondary text-lg px-8">
                      Meet the Team
                    </Link>
                  </div>
                </div>
                
                {/* Floating Stats Cards - Infographic Style */}
                <div className="relative h-[500px] hidden lg:block">
                  {/* Main Logo Card */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-3xl bg-gradient-to-br from-brand-green to-brand-violet p-1 shadow-2xl shadow-brand-green/20 animate-float">
                    <div className="w-full h-full rounded-3xl bg-white dark:bg-brand-black flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-yellow to-brand-orange flex items-center justify-center mb-4">
                        <Play className="w-10 h-10 text-white ml-1" />
                      </div>
                      <span className="text-3xl font-bold text-brand-green dark:text-brand-yellow">gbóyinwá</span>
                      <span className="text-sm text-brand-black/50 dark:text-brand-yellow/50">Media</span>
                    </div>
                  </div>
                  
                  {/* Films Funded Card */}
                  <div className="absolute top-0 right-0 w-44 animate-fade-in-up animate-delay-200">
                    <div className="bg-white dark:bg-brand-black rounded-2xl p-5 shadow-xl border border-brand-green/10 dark:border-brand-yellow/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                          <Clapperboard className="w-6 h-6 text-brand-orange" />
                        </div>
                        <div className="text-3xl font-bold text-brand-green dark:text-brand-yellow">5</div>
                      </div>
                      <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Films Funded</p>
                      <div className="mt-3 h-2 bg-brand-green/10 dark:bg-brand-yellow/10 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-brand-yellow to-brand-orange rounded-full" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Youth Empowerment Card */}
                  <div className="absolute bottom-0 left-0 w-48 animate-fade-in-up animate-delay-300">
                    <div className="bg-white dark:bg-brand-black rounded-2xl p-5 shadow-xl border border-brand-green/10 dark:border-brand-yellow/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-brand-violet/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-brand-violet" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-brand-green dark:text-brand-yellow">16-35</div>
                          <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50">years</p>
                        </div>
                      </div>
                      <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60">Youth Empowerment</p>
                      <div className="mt-3 flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full bg-brand-violet" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Award Badge */}
                  <div className="absolute bottom-20 right-0 animate-fade-in-up animate-delay-400">
                    <div className="w-24 h-24 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg animate-bounce-subtle">
                      <div className="text-center">
                        <Trophy className="w-8 h-8 text-brand-black mx-auto mb-1" />
                        <span className="text-xs font-bold text-brand-black">₦55M</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gbóyindé Grant Featured Section */}
        <section className="relative section-padding bg-brand-green dark:bg-black overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-yellow/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-violet/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group">
                  <Image
                    src="/images/logo-full.png"
                    alt="Gbóyindé Grant for Young Documentary Filmmakers"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-brand-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow text-brand-black text-sm font-bold">
                      <Trophy className="w-4 h-4" />
                      ₦55M Total Funding
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-brand-yellow/20 text-brand-yellow text-sm font-semibold mb-6">
                  Featured Initiative
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  The Gbóyindé Grant
                </h2>
                <p className="text-2xl text-brand-yellow/90 mb-4 font-light italic">
                  &ldquo;Magic in Èkó Grey&rdquo;
                </p>
                <p className="text-white/70 mb-8 leading-relaxed text-lg">
                  A transformative initiative to invest in Nigeria&apos;s emerging documentary film talent. 
                  We&apos;re funding five exceptional young filmmakers with ₦6,000,000 each to create 
                  compelling short documentaries exploring the hidden magic of everyday Lagos life.
                </p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { value: '₦6M', label: 'per filmmaker', icon: Camera },
                    { value: '5', label: 'filmmakers', icon: Users },
                    { value: '10+', label: 'film festivals', icon: Globe },
                    { value: '9', label: 'months timeline', icon: Calendar },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                      <stat.icon className="w-5 h-5 text-brand-yellow mb-2" />
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-white/50">{stat.label}</div>
                    </div>
                  ))}
                </div>
                
                <Link 
                  href="/events/gboyinde-grant-young-documentary-filmmakers" 
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-yellow text-brand-black font-bold hover:bg-brand-yellow/90 transition-colors shadow-lg shadow-brand-yellow/20"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section - Arts/Media Themed */}
        <section className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-sm font-medium mb-4">
                Our Mission
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-4">
                Preserving Stories, Empowering Voices
              </h2>
              <p className="text-brand-black/60 dark:text-brand-yellow/60 max-w-2xl mx-auto">
                We believe in the transformative power of documentary filmmaking to capture truth, 
                celebrate culture, and inspire change.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Camera,
                  title: 'Documentary Excellence',
                  desc: 'Professional-grade production support for authentic storytelling that preserves cultural heritage and captures raw, unfiltered truth.',
                  color: 'from-brand-orange to-brand-yellow',
                  bgColor: 'bg-brand-orange/10',
                },
                {
                  icon: Palette,
                  title: 'Creative Empowerment',
                  desc: 'Nurturing young Nigerian filmmakers aged 16-35 with funding, mentorship, and platforms to bring their artistic visions to life.',
                  color: 'from-brand-violet to-brand-green',
                  bgColor: 'bg-brand-violet/10',
                },
                {
                  icon: Globe,
                  title: 'Global Storytelling',
                  desc: 'Taking authentic Lagos narratives to international film festivals, streaming platforms, and audiences worldwide.',
                  color: 'from-brand-green to-brand-yellow',
                  bgColor: 'bg-brand-green/10',
                },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="group relative overflow-hidden rounded-3xl bg-white dark:bg-brand-black/50 border border-brand-green/10 dark:border-brand-yellow/10 p-8 hover:shadow-2xl hover:shadow-brand-green/10 transition-all duration-500 animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Gradient border on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[2px] rounded-3xl`}>
                    <div className="w-full h-full bg-white dark:bg-brand-black rounded-3xl" />
                  </div>
                  
                  <div className="relative">
                    <div className={`w-16 h-16 mb-6 rounded-2xl ${item.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="w-8 h-8 text-brand-green dark:text-brand-yellow" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-3">
                      {item.title}
                    </h3>
                    <p className="text-brand-black/70 dark:text-brand-yellow/70 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Event Section */}
        {featured && (
          <section className="section-padding bg-gradient-to-b from-brand-yellow/5 to-transparent dark:from-brand-green/5">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-brand-green dark:bg-brand-yellow flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white dark:text-brand-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-green dark:text-brand-yellow">
                    Upcoming Event
                  </h2>
                  <p className="text-brand-black/60 dark:text-brand-yellow/60">
                    Save the date for our next gathering
                  </p>
                </div>
              </div>
              
              <Link
                href={`/events/${featured.slug}`}
                className="group block rounded-3xl overflow-hidden bg-white dark:bg-brand-black/50 border border-brand-green/10 dark:border-brand-yellow/10 hover:border-brand-orange dark:hover:border-brand-yellow transition-all duration-300 hover:shadow-2xl hover:shadow-brand-green/10"
              >
                <div className="grid md:grid-cols-5 gap-0">
                  <div className="md:col-span-2 relative aspect-video md:aspect-auto md:min-h-[320px]">
                    <Image
                      src={featured.image_url || '/images/logo-full.png'}
                      alt={featured.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white dark:to-brand-black md:opacity-100 opacity-0" />
                  </div>
                  <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                      {featured.start_date && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow font-semibold">
                          <Calendar className="w-4 h-4" />
                          {new Date(featured.start_date).toLocaleDateString('en-NG', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      )}
                      {featured.location && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange/10 text-brand-orange">
                          <MapPin className="w-4 h-4" />
                          {featured.location}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-bold text-brand-black dark:text-brand-yellow mb-4 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                      {featured.title}
                    </h3>
                    
                    {featured.summary && (
                      <p className="text-brand-black/70 dark:text-brand-yellow/70 mb-6 line-clamp-2 text-lg">
                        {featured.summary}
                      </p>
                    )}
                    
                    <span className="inline-flex items-center text-brand-green dark:text-brand-yellow font-semibold">
                      View Event Details
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative rounded-3xl bg-gradient-to-r from-brand-green via-brand-violet to-brand-orange p-[2px]">
              <div className="rounded-3xl bg-white dark:bg-brand-black p-12 md:p-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-yellow to-brand-orange flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold gradient-text-brand mb-4">
                  Join the Movement
                </h2>
                <p className="text-brand-black/70 dark:text-brand-yellow/70 mb-8 max-w-xl mx-auto">
                  Be part of our community. Explore our events, read our stories, and discover 
                  the magic of authentic Nigerian storytelling.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/events" className="btn-primary">
                    View Events
                  </Link>
                  <Link href="/blog" className="btn-secondary">
                    Read Blog
                  </Link>
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
