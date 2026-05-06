import Link from 'next/link';
import Container from '../../../components/shared/layout/Container';
import PrimarySection from '../../../components/shared/layout/PrimarySection';

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

      <PrimarySection className="bg-linear-to-br from-primary-700 via-primary-600 to-accent-400 text-white py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
            {hero?.subtitle ?? 'Blog'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {hero?.title ?? 'Blog Tags'}
          </h1>
        </Container>
      </PrimarySection>

      <PrimarySection className="py-12">
        <Container>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Link
                key={tag._id}
                href={`/blog/tags/${tag.slug || tag._id}`}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-gray-900">{tag.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-gray-500">
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
