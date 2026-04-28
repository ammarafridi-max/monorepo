import Navbar from "@travel-suite/frontend-shared/components/v2/sections/Navbar";
import Footer from "@travel-suite/frontend-shared/components/v2/sections/Footer";
import Link from "next/link";
import BlogCard from "@travel-suite/frontend-shared/components/v2/cards/BlogCard";
import { getPublishedBlogPosts } from "@/lib/blogs";

export const metadata = {
  title: "TravelShield Blog",
  description: "Guides, tips, and advice to help you travel with confidence.",
};

export default async function BlogPage({ searchParams }) {
  const params = await searchParams;
  const selectedTag = typeof params?.tag === "string" ? params.tag : "";
  const { blogs } = await getPublishedBlogPosts({
    limit: 100,
    tag: selectedTag || undefined,
  });
  const featuredPost = blogs[0] || null;
  const categories = [
    "All",
    ...new Set(blogs.flatMap((post) => post.tags || []).filter(Boolean)),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-accent-400 text-white py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              TravelShield Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Travel Smarter, Cover Better
            </h1>
            <p className="mt-4 text-primary-100 text-lg max-w-xl mx-auto leading-relaxed">
              Guides, tips, and advice to help you travel with confidence —
              wherever in the world you&apos;re headed.
            </p>
          </div>
        </section>

        <section className="border-b border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 flex-wrap">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={
                  cat === "All"
                    ? "/blog"
                    : `/blog?tag=${encodeURIComponent(cat)}`
                }
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                  (cat === "All" && !selectedTag) || cat === selectedTag
                    ? "bg-primary-700 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>

        {featuredPost && (
          <section className="max-w-7xl mx-auto px-6 pt-14 pb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">
              Featured
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
              <div className="h-56 lg:h-auto bg-gradient-to-br from-primary-200 via-accent-100 to-white flex items-center justify-center">
                <span className="text-8xl opacity-20">✈️</span>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <span className="inline-block self-start bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  {featuredPost.category}
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">
                  {featuredPost.title}
                </h2>
                <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                  {featuredPost.excerptText}
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                      {featuredPost.authorName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">
                        {featuredPost.authorName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {featuredPost.dateLabel} · {featuredPost.readTimeLabel}{" "}
                        min read
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="mt-6 inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors self-start"
                >
                  Read article →
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-6">
            Latest Articles
          </p>
          {blogs.length === 0 ? (
            <div className="text-sm text-gray-500">
              No published articles yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(featuredPost ? blogs.slice(1) : blogs).map((post) => (
                <BlogCard
                  key={post.slug}
                  slug={post.slug}
                  category={post.category}
                  title={post.title}
                  excerpt={post.excerptText}
                  author={post.authorName}
                  date={post.dateLabel}
                  readTime={post.readTimeLabel}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
