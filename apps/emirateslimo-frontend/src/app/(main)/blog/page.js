import { buildBlog, buildGraph, buildOrganization, buildWebPage, buildWebsite } from '@/lib/schema';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import BlogCard from '@/components/BlogCard';
import PageHero from '@/components/Sections/PageHero';

export const metadata = {
  title: { absolute: 'Blog | Emirates Limo' },
  description:
    'Read travel tips, Dubai guides, and chauffeur service insights from Emirates Limo — your trusted luxury transport provider in Dubai and Abu Dhabi.',
  alternates: { canonical: 'https://www.emirateslimo.com/blog' },
  robots: { index: true, follow: true },
};

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND;
const CANONICAL = 'https://www.emirateslimo.com/blog';

async function fetchBlogs() {
  if (!BACKEND) return [];
  try {
    const res = await fetch(`${BACKEND}/api/blogs?status=published&limit=100&page=1`, {
      cache: 'force-cache',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.blogs || json.data || [];
  } catch {
    return [];
  }
}

const schema = buildGraph([
  buildOrganization(),
  buildWebsite(),
  buildWebPage({
    canonical: CANONICAL,
    title: 'Blog | Emirates Limo',
    description:
      'Read travel tips, Dubai guides, chauffeur service insights, and the latest updates from Emirates Limo.',
  }),
  buildBlog({
    canonical: CANONICAL,
    title: 'Blog | Emirates Limo',
    description:
      'Read travel tips, Dubai guides, chauffeur service insights, and the latest updates from Emirates Limo.',
  }),
]);

export default async function BlogPage() {
  const blogs = await fetchBlogs();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\u003c') }}
      />

      <PageHero
        paths={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
        ]}
        title="Blog"
        subtitle="Explore travel guides, Dubai destination tips, chauffeur service advice, and the latest news from Emirates Limo."
      />

      <PrimarySection className="py-15 lg:py-20">
        <Container>
          {blogs.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 font-light text-[15px]">
                No posts available at the moment. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
              {blogs.map((post) => (
                <BlogCard key={post._id} blog={post} />
              ))}
            </div>
          )}
        </Container>
      </PrimarySection>
    </>
  );
}
