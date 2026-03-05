import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getPublishedPosts } from '@/lib/blog';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function BlogListPage() {
  const posts = await getPublishedPosts();

  // Get the first post as featured if available
  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-yellow/10 dark:from-brand-green/20 to-transparent" />
          <div className="relative max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-brand-green dark:text-brand-yellow mb-4">
              Blog
            </h1>
            <p className="text-xl text-brand-black/70 dark:text-brand-yellow/70 max-w-2xl mx-auto">
              Stories, updates, and behind-the-scenes from the Gbóyinwá team and community.
            </p>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-8 px-4">
            <div className="max-w-6xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/20 text-brand-green dark:text-brand-yellow text-sm font-medium mb-6">
                <BookOpen className="w-4 h-4" />
                Latest Post
              </span>
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block rounded-3xl overflow-hidden border border-brand-green/10 dark:border-brand-yellow/10 bg-white dark:bg-brand-black/50 hover:border-brand-orange dark:hover:border-brand-yellow transition-all duration-300 hover:shadow-xl"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-video md:aspect-auto md:min-h-[400px]">
                    <Image
                      src={featuredPost.cover_url || '/images/logo-full.png'}
                      alt={featuredPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-brand-black dark:text-brand-yellow mb-4 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-brand-black/70 dark:text-brand-yellow/70 mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-brand-black/50 dark:text-brand-yellow/50 mb-6">
                      {featuredPost.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(featuredPost.published_at).toLocaleDateString('en-NG', { 
                            dateStyle: 'long' 
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        2 min read
                      </span>
                    </div>
                    <span className="inline-flex items-center text-brand-green dark:text-brand-yellow font-medium">
                      Read article
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Other Posts Grid */}
        {otherPosts.length > 0 && (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-brand-green dark:text-brand-yellow mb-8">
                More Stories
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherPosts.map((post, i) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group card-hover overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
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
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-brand-black dark:text-brand-yellow mb-2 group-hover:text-brand-green dark:group-hover:text-brand-yellow transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-brand-black/70 dark:text-brand-yellow/70 text-sm line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      {post.published_at && (
                        <span className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
                          {new Date(post.published_at).toLocaleDateString('en-NG', { 
                            dateStyle: 'medium' 
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

        {/* Empty State */}
        {posts.length === 0 && (
          <section className="py-20 px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-brand-green dark:text-brand-yellow" />
              </div>
              <h2 className="text-2xl font-bold text-brand-black dark:text-brand-yellow mb-2">
                No posts yet
              </h2>
              <p className="text-brand-black/60 dark:text-brand-yellow/60">
                Check back soon for stories and updates from the team.
              </p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
