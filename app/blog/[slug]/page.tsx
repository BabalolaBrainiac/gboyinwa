import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getPostBySlug } from '@/lib/blog';
import { ArrowLeft, Calendar, Clock, Share2, User, Trophy, Camera, Users, MapPin, Award } from 'lucide-react';
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

async function trackPostView(postId: string) {
  try {
    const supabase = getServiceClient();
    await supabase.rpc('increment_post_view', { p_post_id: postId });
  } catch {
    // Silently fail - don't block page render for view tracking
  }
}

// Default grant post content
const GRANT_POST_SLUG = 'gboyinde-grant-magic-in-eko-grey';

const GRANT_POST_CONTENT = {
  id: 'gboyinde-grant-launch',
  title: 'Introducing The Gbóyindé Grant: "Magic in Èkó Grey"',
  slug: GRANT_POST_SLUG,
  excerpt: 'A transformative ₦55 million initiative to invest in Nigeria\'s emerging documentary film talent. Five young filmmakers will each receive ₦6 million to create compelling short documentaries exploring the hidden magic of everyday Lagos life.',
  cover_url: '/images/logo-full.png',
  published_at: new Date().toISOString(),
  body: `Lagos—the city of dreams, hustle, and untold stories. From the bustling markets of Balogun to the quiet resilience of roadside vendors, from the vibrant energy of Afrobeats street performers to the unwavering spirit of community leaders, Lagos is a tapestry of narratives waiting to be captured.

Today, we are thrilled to announce The Gbóyindé Grant: "Magic in Èkó Grey"—a groundbreaking initiative designed to empower the next generation of Nigerian documentary filmmakers.

## What is The Gbóyindé Grant?

The Gbóyindé Grant is a ₦55 million investment in Nigeria's emerging documentary talent. We are funding five exceptional young filmmakers with ₦6,000,000 each to create compelling short documentaries that explore the hidden magic of everyday Lagos life.

Our mission is simple: to amplify authentic voices and hidden narratives that often go unnoticed in mainstream media. We believe that the most powerful stories are found in the everyday lives of ordinary people doing extraordinary things.

## Why "Magic in Èkó Grey"?

Lagos is often portrayed through a specific lens—traffic, hustle, and chaos. But beneath this surface lies a world of beauty, resilience, and magic. The "grey" represents the often-overlooked spaces, the in-between moments, and the unsung heroes who make this city what it is.

We are looking for stories that:
- Celebrate the resilience and creativity of Lagosians
- Highlight cultural practices and traditions at risk of being forgotten
- Showcase the intersection of tradition and modernity
- Amplify voices from underserved communities
- Capture the everyday magic that makes Lagos unique

## Who Can Apply?

The grant is open to Nigerian filmmakers aged 16-35 who are passionate about documentary storytelling. Whether you're a first-time filmmaker or have some experience under your belt, we want to hear your story ideas.

## What Grant Recipients Receive

Beyond the ₦6 million funding, our grant recipients will receive:

**Production Support**: Access to equipment, technical assistance, and production resources to bring your vision to life.

**Mentorship**: Guidance from industry professionals who have walked the path before you, providing insights into storytelling, production, and distribution.

**Distribution Opportunities**: Your films will be showcased at 10+ film festivals and made available on streaming platforms, ensuring your stories reach global audiences.

**Community**: Join a network of like-minded filmmakers, creating opportunities for collaboration and growth.

## The Timeline

The grant program runs over 9 months, giving filmmakers ample time to research, shoot, and polish their documentaries. We believe in quality over speed—great stories take time to tell properly.

## Our Vision

At Gbóyinwá Media, we believe in the transformative power of documentary filmmaking. By investing in young Nigerian filmmakers, we're not just funding films—we're preserving culture, empowering voices, and creating a legacy of authentic Nigerian storytelling.

The Gbóyindé Grant is more than a funding opportunity; it's a movement. It's a commitment to ensuring that Nigerian stories are told by Nigerians, for the world.

## How to Get Involved

Applications for The Gbóyindé Grant open soon. Follow us on our social media channels and subscribe to our newsletter to be the first to know when applications go live.

Are you ready to capture the magic in Èkó Grey? We can't wait to see your vision.

---

*The Gbóyindé Grant is an initiative of Gbóyinwá Media, a Lagos-based documentary and storytelling company dedicated to amplifying authentic Nigerian voices.*`,
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  
  // Check if this is the default grant post
  let post = await getPostBySlug(slug);
  
  if (!post && slug === GRANT_POST_SLUG) {
    post = GRANT_POST_CONTENT as any;
  }
  
  if (!post) notFound();
  
  // Track view for this post (only for real posts, not default content)
  if ((post as { id?: string }).id && (post as { id?: string }).id !== 'gboyinde-grant-launch') {
    await trackPostView((post as { id: string }).id);
  }
  
  const author = await getPostAuthor((post as { author_id?: string }).author_id || null);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Image */}
        {post.cover_url && (
          <div className="relative w-full h-[35vh] md:h-[45vh]">
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
              <div className="max-w-4xl mx-auto px-4 pb-10">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Blog
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <article className="py-10 px-4">
          <div className="max-w-3xl mx-auto">
            {!post.cover_url && (
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-brand-green dark:text-brand-yellow hover:underline mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            )}
            
            <h1 className={`font-bold text-brand-green dark:text-brand-yellow mb-4 ${post.cover_url ? 'text-2xl md:text-3xl' : 'text-2xl md:text-3xl'}`}>
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-brand-green/10 dark:border-brand-yellow/10">
              {post.published_at && (
                <span className="flex items-center gap-1 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at).toLocaleDateString('en-NG', { dateStyle: 'long' })}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                <Clock className="w-4 h-4" />
                4 min read
              </span>
              {author ? (
                <span className="flex items-center gap-1 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                  <User className="w-4 h-4" />
                  By {author.display_name || 'Admin'}
                  {author.role === 'superadmin' && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-brand-yellow/20 text-brand-green dark:text-brand-yellow">Superadmin</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                  <User className="w-4 h-4" />
                  By Gbóyinwá Team
                </span>
              )}
              <div className="ml-auto">
                <ShareButton title={post.title} />
              </div>
            </div>
            
            {post.excerpt && (
              <p className="text-lg text-brand-black/80 dark:text-brand-yellow/80 mb-6 font-medium leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Grant Highlights */}
            {slug === GRANT_POST_SLUG && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="glass-card rounded-xl p-4 text-center">
                  <Trophy className="w-6 h-6 text-brand-yellow mx-auto mb-2" />
                  <div className="text-xl font-bold text-brand-green dark:text-brand-yellow">₦55M</div>
                  <div className="text-xs text-brand-black/50 dark:text-brand-yellow/50">Total Funding</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <Camera className="w-6 h-6 text-brand-green dark:text-brand-yellow mx-auto mb-2" />
                  <div className="text-xl font-bold text-brand-green dark:text-brand-yellow">5</div>
                  <div className="text-xs text-brand-black/50 dark:text-brand-yellow/50">Filmmakers</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 text-brand-violet mx-auto mb-2" />
                  <div className="text-xl font-bold text-brand-green dark:text-brand-yellow">16-35</div>
                  <div className="text-xs text-brand-black/50 dark:text-brand-yellow/50">Age Range</div>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <MapPin className="w-6 h-6 text-brand-orange mx-auto mb-2" />
                  <div className="text-xl font-bold text-brand-green dark:text-brand-yellow">Lagos</div>
                  <div className="text-xs text-brand-black/50 dark:text-brand-yellow/50">Focus City</div>
                </div>
              </div>
            )}
            
            <div className="prose dark:prose-invert max-w-none text-brand-black/80 dark:text-brand-yellow/80 whitespace-pre-wrap leading-relaxed text-sm">
              {post.body.split('\n').map((paragraph: string, idx: number) => {
                if (paragraph.startsWith('## ')) {
                  return <h2 key={idx} className="text-xl font-bold text-brand-green dark:text-brand-yellow mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return <p key={idx} className="font-semibold text-brand-green dark:text-brand-yellow my-3">{paragraph.replace(/\*\*/g, '')}</p>;
                }
                if (paragraph.startsWith('- ')) {
                  return <li key={idx} className="ml-4 mb-2">{paragraph.replace('- ', '')}</li>;
                }
                if (paragraph.trim() === '---') {
                  return <hr key={idx} className="my-6 border-brand-green/10 dark:border-brand-yellow/10" />;
                }
                if (paragraph.trim()) {
                  return <p key={idx} className="mb-4">{paragraph}</p>;
                }
                return null;
              })}
            </div>

            {/* CTA for grant post */}
            {slug === GRANT_POST_SLUG && (
              <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-brand-green to-brand-violet">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-brand-yellow" />
                  <h3 className="text-lg font-bold text-white">Ready to Apply?</h3>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Learn more about The Gbóyindé Grant and submit your application today.
                </p>
                <Link 
                  href="/events/gboyinde-grant-young-documentary-filmmakers"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-yellow text-brand-black font-semibold text-sm hover:bg-brand-yellow/90 transition-all"
                >
                  View Grant Details
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            )}
          </div>
        </article>

        {/* Related/Navigation */}
        <section className="py-10 px-4 border-t border-brand-green/10 dark:border-brand-yellow/10">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-brand-green dark:text-brand-yellow hover:underline text-sm"
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
