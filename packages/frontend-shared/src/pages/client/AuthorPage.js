import Image from 'next/image';
import Breadcrumb from '../../components/shared/layout/Breadcrumb';
import Container from '../../components/shared/layout/Container';
import PrimarySection from '../../components/shared/layout/PrimarySection';
import BlogCard from '../../components/cards/BlogCard';

export default function AuthorPage({
  author,
  posts = [],
  breadcrumbPaths = [],
  graph,
  breadcrumbJsonLd,
}) {
  const profile = author?.authorProfile || {};
  const credentials = profile.credentials || [];
  const expertise = profile.expertise || [];
  const sameAs = profile.sameAs || [];
  const bioParagraphs = (profile.bio || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

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

      <PrimarySection className="bg-linear-to-br from-primary-700 via-primary-600 to-accent-400 py-16 text-white">
        <Container>
          {breadcrumbPaths.length > 0 && (
            <div className="mb-5">
              <Breadcrumb paths={breadcrumbPaths} dark includeSchema={false} />
            </div>
          )}

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            {profile.avatarUrl && (
              <Image
                src={profile.avatarUrl}
                alt={author.name}
                width={128}
                height={128}
                className="h-28 w-28 shrink-0 rounded-full object-cover ring-4 ring-white/20"
              />
            )}

            <div className="min-w-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
                Author
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                {author?.name}
              </h1>
              {profile.jobTitle && (
                <p className="mt-2 text-lg text-primary-100">{profile.jobTitle}</p>
              )}
              {bioParagraphs.length > 0 && (
                <div className="mt-4 max-w-2xl space-y-3 text-primary-100">
                  {bioParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              )}

              {sameAs.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-3">
                  {sameAs.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        rel="me noopener noreferrer"
                        target="_blank"
                        className="rounded-full border border-white/30 px-4 py-1.5 text-sm text-white transition hover:bg-white/10"
                      >
                        {hostLabel(url)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Container>
      </PrimarySection>

      {(credentials.length > 0 || expertise.length > 0) && (
        <PrimarySection className="border-b border-gray-100 py-10">
          <Container className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {credentials.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">
                  Background
                </h2>
                <ul className="space-y-2 text-gray-700">
                  {credentials.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {expertise.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">
                  Writes about
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {expertise.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Container>
        </PrimarySection>
      )}

      <PrimarySection className="py-12">
        <Container>
          <h2 className="mb-6 text-2xl font-medium text-gray-900">
            {posts.length > 0 ? `Articles by ${author?.name}` : 'Articles'}
          </h2>

          {posts.length === 0 ? (
            <p className="text-gray-500">No published articles yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
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
          )}
        </Container>
      </PrimarySection>
    </>
  );
}

function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
