import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getPublishedPosts } from '@/lib/blog';
import { Calendar, Clock, ArrowRight, Mail, Trophy, Camera } from 'lucide-react';
import { SubscriptionForm } from '@/components/subscription-form';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const DEFAULT_GRANT_POST = {
  id: 'gboyinde-grant-launch',
  title: 'Introducing The Gbóyindé Grant: "Magic in Èkó Grey"',
  slug: 'gboyinde-grant-magic-in-eko-grey',
  excerpt: 'A transformative ₦55 million initiative to invest in Nigeria\'s emerging documentary film talent. Five young filmmakers will each receive ₦6 million to create compelling short documentaries exploring the hidden magic of everyday Lagos life.',
  cover_url: '/images/logo-full.png',
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

export default async function LettersPage() {
  const posts = await getPublishedPosts();

  const displayPosts = posts.length > 0 ? posts : [DEFAULT_GRANT_POST];
  const featuredPost = displayPosts[0];
  const otherPosts = displayPosts.slice(1);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative py-16 md:py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 yellow-fade-top pointer-events-none" />
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/15 dark:bg-brand-yellow/10 text-brand-green dark:text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
              <Mail className="w-3.5 h-3.5" />
              Stories &amp; Dispatches
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-green dark:text-brand-yellow mb-3">
              Letters
            </h1>
            <p className="text-base text-brand-black/60 dark:text-brand-yellow/60 max-w-xl mx-auto">
              Stories, updates, and behind-the-scenes dispatches from the Gbóyinwá team and community.
            </p>
          </div>
        </section>

        {/* Featured Letter */}
        {featuredPost && (
          <section className="pb-8 px-4">
            <div className="max-w-6xl mx-auto">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/20 text-brand-green dark:text-brand-yellow text-xs font-bold uppercase mb-4">
                <Trophy className="w-3.5 h-3.5" />
                Latest Letter
              </span>
              <Link
                href={`/letters/${featuredPost.slug}`}
                className="group block rounded-2xl overflow-hidden glass-card hover:border-brand-orange dark:hover:border-brand-yellow transition-all duration-300 hover:shadow-xl"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-video md:aspect-auto md:min-h-[320px]">
                    <Image
                      src={featuredPost.cover_url || '/images/logo-full.png'}
                      alt={featuredPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <h2 className="text-xl md:text-2xl font-bold text-brand-black dark:text-brand-yellow mb-3 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-brand-black/60 dark:text-brand-yellow/60 mb-4 line-clamp-3 text-sm leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-brand-black/50 dark:text-brand-yellow/50 mb-4">
                      {featuredPost.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(featuredPost.published_at).toLocaleDateString('en-NG', {
                            dateStyle: 'long',
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        4 min read
                      </span>
                    </div>
                    <span className="inline-flex items-center text-brand-green dark:text-brand-yellow font-semibold text-sm">
                      Read letter
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Other Letters Grid */}
        {otherPosts.length > 0 && (
          <section className="py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold text-brand-green dark:text-brand-yellow mb-6">
                More Letters
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {otherPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/letters/${post.slug}`}
                    className="group glass-card overflow-hidden hover:border-brand-orange dark:hover:border-brand-yellow transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={post.cover_url || '/images/logo-full.png'}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold text-brand-black dark:text-brand-yellow mb-2 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-brand-black/60 dark:text-brand-yellow/60 text-sm line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                      )}
                      {post.published_at && (
                        <span className="text-xs text-brand-black/50 dark:text-brand-yellow/50">
                          {new Date(post.published_at).toLocaleDateString('en-NG', {
                            dateStyle: 'medium',
                          })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Subscribe CTA */}
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl p-6 md:p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-brand-green dark:text-brand-yellow" />
              </div>
              <h3 className="text-lg font-bold text-brand-green dark:text-brand-yellow mb-2">
                Subscribe to Letters
              </h3>
              <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50 mb-4">
                Get stories, dispatches, and updates from the Gbóyinwá community — straight to your inbox.
              </p>
              <SubscriptionForm variant="card" title="Subscribe to Letters" description="Get dispatches from the Gbóyinwá community delivered to your inbox." />
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
