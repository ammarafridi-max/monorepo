import Container from "../../components/v1/layout/Container";
import PrimarySection from "../../components/v1/layout/PrimarySection";
import PageHero from "../../components/v1/sections/PageHero";
import BlogCard from "../../components/v1/cards/BlogCard";
import BlogPaginationBar from "../../components/v1/ui/BlogPaginationBar";

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
              <BlogCard key={post._id} blog={post} />
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
