import Container from '../../../components/shared/layout/Container';
import PrimarySection from '../../../components/shared/layout/PrimarySection';
import BlogCard from '../../../components/cards/v2/BlogCard';
import BlogPaginationBar from '../../../components/ui/v1/BlogPaginationBar';

export default function BlogTagDetailPage({
  tag,
  blogs = [],
  pagination = null,
  currentPage = 1,
  breadcrumbPaths = [],
  graph,
  breadcrumbJsonLd,
  heroPoints = [],
}) {
  const basePath = `/blog/tags/${tag?.slug || tag?._id}`;

  return (
    <>
      {graph && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
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
            Tag
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {tag?.name}
          </h1>
          {tag?.description && (
            <p className="mt-4 text-primary-100 text-lg max-w-xl">
              {tag.description}
            </p>
          )}
        </Container>
      </PrimarySection>

      <PrimarySection className="py-12">
        <Container>
          {blogs.length === 0 ? (
            <p className="text-gray-500">No published posts found for this tag yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
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
                basePath={basePath}
              />
            </>
          )}
        </Container>
      </PrimarySection>
    </>
  );
}
