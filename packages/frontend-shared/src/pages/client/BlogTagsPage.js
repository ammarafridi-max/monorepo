import Link from 'next/link';
import Container from '../../components/v1/layout/Container';
import PrimarySection from '../../components/v1/layout/PrimarySection';
import PageHero from '../../components/v1/sections/PageHero';

/**
 * BlogTagsPage — shared UI component for the /blog/tags index page.
 *
 * Props:
 *   tags             — array of tag objects from the API
 *   hero             — { title, subtitle }
 *   breadcrumbPaths  — array of { label, path }
 *   schema           — pre-built JSON-LD graph object
 *   breadcrumbJsonLd — pre-built breadcrumb JSON-LD object
 */
export default function BlogTagsPage({
  tags = [],
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

      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Link
                key={tag._id}
                href={`/blog/tags/${tag.slug || tag._id}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="text-xl font-medium text-gray-900">{tag.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm font-light text-gray-600">
                  {tag.description || 'Read all posts under this tag.'}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
