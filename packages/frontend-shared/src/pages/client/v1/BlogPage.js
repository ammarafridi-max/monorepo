import Container from "../../../components/shared/layout/Container";
import PrimarySection from "../../../components/shared/layout/PrimarySection";
import PageHero from "../../../components/sections/v1/PageHero";
import BlogCard from "../../../components/cards/v1/BlogCard";
import BlogPaginationBar from "../../../components/ui/v1/BlogPaginationBar";

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

      <PageHero
        title={hero?.title}
        subtitle={hero?.subtitle}
        points={hero?.points ?? []}
        paths={breadcrumbPaths}
      />

      <PrimarySection>
        <Container>
          <div className="block items-start gap-7 py-10 lg:grid lg:grid-cols-3 lg:gap-10 lg:py-15">
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
            basePath="/blog"
          />
        </Container>
      </PrimarySection>
    </>
  );
}
