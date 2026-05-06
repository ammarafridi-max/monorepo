import Container from '../../../components/shared/layout/Container';
import PrimarySection from '../../../components/shared/layout/PrimarySection';
import PageHero from '../../../components/sections/v1/PageHero';
import BlogCard from '../../../components/cards/v1/BlogCard';
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

      <PageHero
        title={tag?.name}
        subtitle={tag?.description || 'Published posts under this tag.'}
        points={heroPoints}
        paths={breadcrumbPaths}
      />

      <PrimarySection className="py-10 lg:py-14">
        <Container>
          {blogs.length === 0 ? (
            <p className="text-gray-600">
              No published posts found for this tag yet.
            </p>
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
                    date={post.createdAt}
                    readTime={post.readingTime}
                    coverImageUrl={post.coverImageUrl}
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
