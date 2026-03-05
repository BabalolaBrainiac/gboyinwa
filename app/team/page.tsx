import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getTeamMembers } from '@/lib/team';
import { Users, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const TEAM_DATA = [
  {
    full_name: 'Daniel Ayodele Adeyinka',
    title: 'Communications Lead',
    image_url: '',
  },
  {
    full_name: 'Karamat Ademilade Eko',
    title: 'Lead Project Manager',
    image_url: '',
  },
  {
    full_name: 'Taribo Adeyinka Akinnukawe',
    title: 'Legal Lead',
    image_url: '',
  },
  {
    full_name: 'Opeyemi Daniel Babalola',
    title: 'Software Engineer',
    image_url: '',
  },
  {
    full_name: 'Victoria Adunni Ogunwemimo',
    title: 'Team Member',
    image_url: '',
  },
  {
    full_name: 'Oluwatimilehin Michael Coker',
    title: 'Chief of Operations',
    image_url: '',
  },
];

const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop';

export default async function TeamPage() {
  const dbMembers = await getTeamMembers();
  const members = dbMembers.length > 0 ? dbMembers : TEAM_DATA.map((m, i) => ({ ...m, id: i.toString(), sort_order: i }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-yellow/10 dark:from-brand-green/20 to-transparent" />
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/20 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              The People Behind the Mission
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-brand-green dark:text-brand-yellow mb-4">
              Meet the Team
            </h1>
            <p className="text-xl text-brand-black/70 dark:text-brand-yellow/70 max-w-2xl mx-auto">
              Dedicated professionals working to amplify authentic Nigerian voices and 
              empower the next generation of documentary filmmakers.
            </p>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((m, i) => (
                <div
                  key={m.id || i}
                  className="group card-hover p-8 text-center animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-yellow via-brand-orange to-brand-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-brand-black shadow-lg">
                      <Image
                        src={m.image_url || PLACEHOLDER_AVATAR}
                        alt={m.full_name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="128px"
                      />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-brand-black dark:text-brand-yellow mb-1">
                    {m.full_name}
                  </h2>
                  <p className="text-brand-orange dark:text-brand-yellow font-medium">
                    {m.title}
                  </p>
                  <div className="mt-4 w-12 h-1 bg-gradient-to-r from-brand-yellow to-brand-orange rounded-full mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl bg-brand-green dark:bg-brand-yellow/10 p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-yellow/20 flex items-center justify-center">
                <Award className="w-8 h-8 text-brand-yellow" />
              </div>
              <h2 className="text-3xl font-bold text-white dark:text-brand-yellow mb-4">
                Join Our Mission
              </h2>
              <p className="text-white/80 dark:text-brand-yellow/70 max-w-xl mx-auto mb-8">
                We&apos;re always looking for passionate individuals who believe in the power 
                of documentary storytelling to create positive change in Nigeria.
              </p>
              <a 
                href="mailto:hello@gboyinwa.com" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-yellow text-brand-black font-bold hover:bg-brand-yellow/90 transition-colors"
              >
                Get in Touch
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
