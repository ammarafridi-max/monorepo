import Container from '../../../components/shared/layout/Container';
import PrimarySection from '../../../components/shared/layout/PrimarySection';
import BlogCard from '../../../components/cards/v2/BlogCard';
import BlogPaginationBar from '../../../components/ui/v1/BlogPaginationBar';

export default function BlogPage({
  blogs = [],
  pagination = null,
  currentPage = 1,
  hero,
  breadcrumbPaths = [],
  schema,
  breadcrumbJsonLd,
}) {
  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}

      <PrimarySection className="bg-linear-to-br from-primary-700 via-primary-600 to-accent-400 text-white py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
            {hero?.subtitle ?? 'Blog'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {hero?.title ?? 'Blog'}
          </h1>
        </Container>
      </PrimarySection>

      <PrimarySection className="py-12">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {blogs.map((post) => (
              <BlogCard
                key={post._id}
                slug={post.slug}
                category={post.category}
                title={post.title}
                excerpt={post.excerpt}
                author={post.author}
                date={post.publishedAt || post.createdAt}
                readTime={post.readingTime}
                coverImageUrl={post.coverImageUrl}
                tags={post.tags}
              />
            ))}
          </div>
          <BlogPaginationBar
            pagination={pagination}
            currentPage={currentPage}
            basePath="/blog"
          />
        </Container>
      </PrimarySection>
    </>
  );
}
