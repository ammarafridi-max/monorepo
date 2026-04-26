import Container from "../../components/v1/layout/Container";
import PrimarySection from "../../components/v1/layout/PrimarySection";
import PageHero from "../../components/v1/sections/PageHero";
import BlogCard from "../../components/v1/cards/BlogCard";
import BlogPaginationBar from "../../components/v1/ui/BlogPaginationBar";

/**
 * BlogPage — shared UI component for the /blog listing page.
 *
 * Props:
 *   blogs            — array of published blog posts for the current page
 *   pagination       — pagination object from the API
 *   currentPage      — active page number
 *   hero             — { title, subtitle }
 *   breadcrumbPaths  — array of { label, path }
 *   schema           — pre-built JSON-LD graph object
 *   breadcrumbJsonLd — pre-built breadcrumb JSON-LD object
 */
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
