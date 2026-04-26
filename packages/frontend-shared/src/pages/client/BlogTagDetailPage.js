import Container from '../../components/v1/layout/Container';
import PrimarySection from '../../components/v1/PrimarySection';
import BlogHero from '../../components/v1/blog/BlogHero';
import BlogCard from '../../components/v1/blog/BlogCard';
import BlogPaginationBar from '../../components/v1/blog/BlogPaginationBar';

/**
 * BlogTagDetailPage — shared UI component for the /blog/tags/[slug] page.
 *
 * Props:
 *   tag              — the resolved tag object { name, description, slug, _id }
 *   blogs            — array of posts for this tag on the current page
 *   pagination       — pagination object from the API
 *   currentPage      — active page number
 *   breadcrumbPaths  — array of { label, path }
 *   graph            — pre-built JSON-LD graph object
 *   breadcrumbJsonLd — pre-built breadcrumb JSON-LD object
 */
export default function BlogTagDetailPage({
  tag,
  blogs = [],
  pagination = null,
  currentPage = 1,
  breadcrumbPaths = [],
  graph,
  breadcrumbJsonLd,
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

      <BlogHero
        title={tag?.name}
        subtitle={tag?.description || 'Published posts under this tag.'}
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
                  <BlogCard key={post._id} blog={post} />
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
