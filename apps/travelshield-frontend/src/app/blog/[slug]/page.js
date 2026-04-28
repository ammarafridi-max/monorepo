import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowLeft, Calendar } from "lucide-react";
import Navbar from "@travel-suite/frontend-shared/components/v2/sections/Navbar";
import Footer from "@travel-suite/frontend-shared/components/v2/sections/Footer";
import BlogCard from "@travel-suite/frontend-shared/components/v2/cards/BlogCard";
import TableOfContents from "@travel-suite/frontend-shared/components/v2/ui/TableOfContents";
import ShareButtons from "@travel-suite/frontend-shared/components/v2/ui/ShareButtons";
import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blogs";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — TravelShield Blog`,
    description: post.excerptText,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) notFound();

  const { blogs } = await getPublishedBlogPosts({ limit: 100 });
  const related = blogs
    .filter((blog) => blog.slug !== slug)
    .sort((a, b) => {
      const aOverlap =
        a.tags?.filter((tag) => post.tags?.includes(tag)).length || 0;
      const bOverlap =
        b.tags?.filter((tag) => post.tags?.includes(tag)).length || 0;
      return bOverlap - aOverlap;
    })
    .slice(0, 3);
  const headings = post.headings || [];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />

      <main className="flex-1">
        <section className="bg-linear-to-br from-primary-700 via-primary-600 to-accent-400 text-white py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-primary-200 hover:text-white text-sm mb-8 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Blog
            </Link>
            <div className="max-w-3xl">
              <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-extrabold leading-tight">
                {post.title}
              </h1>
              <div className="mt-6 flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {post.authorName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <span className="text-sm font-medium">{post.authorName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary-200 text-sm">
                  <Calendar size={14} />
                  <span>{post.dateLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary-200 text-sm">
                  <Clock size={14} />
                  <span>{post.readTimeLabel} min read</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 xl:grid-cols-[220px_1fr_260px] gap-10 items-start">
          <aside className="hidden xl:block">
            <TableOfContents headings={headings} />
          </aside>

          <div className="min-w-0">
            <div className="h-64 bg-linear-to-br from-primary-100 via-accent-50 to-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm mb-10">
              <span className="text-8xl opacity-20">✈️</span>
            </div>

            <article className="flex flex-col gap-6">
              <div
                className="prose prose-gray max-w-none prose-headings:scroll-mt-8 prose-a:text-primary-700"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>

            <div className="mt-12 bg-primary-700 text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="font-bold text-lg">Ready to get covered?</p>
                <p className="text-primary-200 text-sm mt-1">
                  Get an instant quote — takes under 3 minutes.
                </p>
              </div>
              <Link
                href="/insurance-booking/quote"
                className="bg-white text-primary-700 hover:bg-primary-50 font-bold text-sm px-6 py-3 rounded-full transition-colors shrink-0"
              >
                Get a Free Quote →
              </Link>
            </div>
          </div>

          <aside className="flex flex-col gap-8">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <ShareButtons slug={slug} title={post.title} />
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Recent Posts
              </span>
              <div className="mt-4 flex flex-col gap-4">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group flex flex-col gap-1.5 bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-xs font-semibold text-primary-600">
                      {p.category}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{p.authorName}</span>
                      <span>·</span>
                      <span>{p.readTimeLabel} min read</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="border-t border-gray-100 bg-gray-50 py-16 px-6">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-6">
                Keep Reading
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((p) => (
                  <BlogCard
                    key={p.slug}
                    slug={p.slug}
                    category={p.category}
                    title={p.title}
                    excerpt={p.excerptText}
                    author={p.authorName}
                    date={p.dateLabel}
                    readTime={p.readTimeLabel}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
