import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { LuDot } from 'react-icons/lu';
import {
  buildBlogPosting,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import Breadcrumb from '@/components/Breadcrumb';
import FAQAccordion from '@/components/FAQAccordion';
import BlogPostSidebar from './BlogPostSidebar';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND;

async function fetchPostBySlug(slug) {
  if (!BACKEND) return null;
  try {
    const res = await fetch(`${BACKEND}/api/blogs/slug/${encodeURIComponent(slug)}`, {
      cache: 'force-cache',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.blog || json.data || null;
  } catch {
    return null;
  }
}

async function fetchRecentPosts(excludeId) {
  if (!BACKEND) return [];
  try {
    const res = await fetch(`${BACKEND}/api/blogs?status=published&limit=10&page=1`, {
      cache: 'force-cache',
    });
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json.data?.blogs || json.data || [];
    return posts
      .filter((p) => p._id !== excludeId)
      .sort((a, b) => {
        const aDate = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  if (!BACKEND) return [{ slug: '_placeholder' }];
  try {
    const res = await fetch(`${BACKEND}/api/blogs?status=published&limit=1000&page=1`, {
      cache: 'force-cache',
    });
    if (!res.ok) return [{ slug: '_placeholder' }];
    const json = await res.json();
    const posts = (json.data?.blogs || json.data || []).filter((p) => p.slug);
    return posts.length > 0 ? posts.map((p) => ({ slug: p.slug })) : [{ slug: '_placeholder' }];
  } catch {
    return [{ slug: '_placeholder' }];
  }
}

export async function generateMetadata({ params }) {
  const post = await fetchPostBySlug(params.slug);
  if (!post) {
    return {
      title: 'Blog Post Not Found',
      robots: { index: false, follow: false },
    };
  }
  const canonical = `https://www.emirateslimo.com/blog/${params.slug}`;
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      url: canonical,
      images: [{ url: post.coverImageUrl || '/hero-bg.webp' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: [post.coverImageUrl || '/hero-bg.webp'],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await fetchPostBySlug(params.slug);
  if (!post) notFound();

  const recentPosts = await fetchRecentPosts(post._id);

  const canonical = `https://www.emirateslimo.com/blog/${params.slug}`;
  const faqs = post.faqs || [];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical,
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
    }),
    buildBlogPosting({
      canonical,
      title: post.title,
      description: post.excerpt || post.metaDescription,
      image: post.coverImageUrl,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      authorName: post.author?.name,
    }),
    ...(faqs.length > 0
      ? [
          buildFAQPage({
            canonical,
            title: `${post.title} FAQs`,
            description: post.metaDescription || post.excerpt,
            faqs,
          }),
        ]
      : []),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\u003c') }}
      />

      <PrimarySection className="pt-10 pb-20 lg:pt-20 lg:pb-12">
        <Container className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-15">
          <div>
            {post.coverImageUrl && (
              <div className="bg-gray-100 aspect-[16/8] rounded-3xl overflow-hidden mb-10">
                <img
                  src={post.coverImageUrl}
                  className="object-cover object-center w-full h-full"
                  alt={post.title}
                />
              </div>
            )}

            <div className="mb-10">
              <Breadcrumb
                paths={[
                  { label: 'Home', href: '/' },
                  { label: 'Blog', href: '/blog' },
                  { label: post.title, href: `/blog/${params.slug}` },
                ]}
              />
              <h1 className="text-3xl lg:text-4xl font-medium leading-9 lg:leading-12 mb-4 mt-5">
                {post.title}
              </h1>
              <div className="flex items-center font-light text-gray-900/50 text-sm mb-4">
                {post.updatedAt ? (
                  <span>Updated {format(new Date(post.updatedAt), 'dd MMM yyyy')}</span>
                ) : post.publishedAt ? (
                  <span>Published {format(new Date(post.publishedAt), 'dd MMM yyyy')}</span>
                ) : null}
                {post.author?.name && (
                  <>
                    <LuDot className="text-lg" />
                    <span>{post.author.name}</span>
                  </>
                )}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <>
                    <LuDot className="text-lg" />
                    <span>{post.tags.join(', ')}</span>
                  </>
                )}
              </div>
            </div>

            {post.quickAnswer && (
              <div className="mb-8 rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.16em] text-primary-700">
                  Quick Answer
                </p>
                <p className="text-[15px] leading-7 text-gray-700">{post.quickAnswer}</p>
              </div>
            )}

            <div
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="font-outfit blog_post"
            />

            {faqs.length > 0 && (
              <section className="mt-14">
                <h2 className="mb-6 text-2xl font-medium text-gray-900">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <FAQAccordion key={`${faq.question}-${index}`} question={faq.question}>
                      <p>{faq.answer}</p>
                    </FAQAccordion>
                  ))}
                </div>
              </section>
            )}
          </div>

          <BlogPostSidebar
            recentPosts={recentPosts}
            shareUrl={canonical}
            shareTitle={post.title}
          />
        </Container>
      </PrimarySection>
    </>
  );
}
