import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import { buildBreadcrumbList } from '@travel-suite/frontend-shared/utils/breadcrumb';
import { SITE_URL } from '@/config';

export default function PageHero({ title, subtitle, paths = [] }) {
  const breadcrumbSchema = buildBreadcrumbList({ paths, baseUrl: SITE_URL });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="bg-gradient-to-b from-sand-100 to-sand-200 py-16 md:py-20">
        <Container>
          {paths.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-mute">
              {paths.map((p, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true" className="select-none">/</span>}
                  {i < paths.length - 1 ? (
                    <Link
                      href={p.href ?? p.path ?? '/'}
                      className="hover:text-clay-600 transition-colors"
                    >
                      {p.label}
                    </Link>
                  ) : (
                    <span className="text-ink-soft">{p.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <h1 className="font-display text-h2 font-semibold text-ink leading-tight">{title}</h1>

          {subtitle && (
            <p className="mt-4 max-w-2xl text-lead text-ink-soft leading-relaxed">{subtitle}</p>
          )}
        </Container>
      </section>
    </>
  );
}
