import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getPostBySlug } from '@/lib/blog';
import { ArrowLeft, Calendar, Clock, Share2, User } from 'lucide-react';
import { ShareButton } from '@/components/share-button';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function getPostAuthor(authorId: string | null) {
  if (!authorId) return null;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', authorId)
    .single();
  return data;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  
  const author = await getPostAuthor((post as { author_id?: string }).author_id || null);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Image */}
        {post.cover_url && (
          <div className="relative w-full h-[40vh] md:h-[50vh]">
            <Image
              src={post.cover_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-brand-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0">
              <div className="max-w-4xl mx-auto px-4 pb-12">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Blog
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <article className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            {!post.cover_url && (
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-brand-green dark:text-brand-yellow hover:underline mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            )}
            
            <h1 className={`font-bold text-brand-green dark:text-brand-yellow mb-4 ${post.cover_url ? 'text-3xl md:text-4xl' : 'text-3xl'}`}>
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-brand-green/10 dark:border-brand-yellow/10">
              {post.published_at && (
                <span className="flex items-center gap-1 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at).toLocaleDateString('en-NG', { dateStyle: 'long' })}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                <Clock className="w-4 h-4" />
                3 min read
              </span>
              {author && (
                <span className="flex items-center gap-1 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                  <User className="w-4 h-4" />
                  By {author.display_name || 'Admin'}
                  {author.role === 'superadmin' && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-brand-yellow/20 text-brand-green dark:text-brand-yellow">Superadmin</span>
                  )}
                </span>
              )}
              <div className="ml-auto">
                <ShareButton title={post.title} />
              </div>
            </div>
            
            {post.excerpt && (
              <p className="text-xl text-brand-black/80 dark:text-brand-yellow/80 mb-8 font-medium leading-relaxed">
                {post.excerpt}
              </p>
            )}
            
            <div className="prose dark:prose-invert prose-lg max-w-none text-brand-black/80 dark:text-brand-yellow/80 whitespace-pre-wrap leading-relaxed">
              {post.body}
            </div>
          </div>
        </article>

        {/* Related/Navigation */}
        <section className="py-12 px-4 border-t border-brand-green/10 dark:border-brand-yellow/10">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-brand-green dark:text-brand-yellow hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              All articles
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
