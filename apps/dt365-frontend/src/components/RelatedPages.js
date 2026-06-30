import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';

// "Related pages" block: 3-4 inline-contextual internal links rendered as
// cards near the bottom of each landing page (before the contact CTA).
// Distinct from header/footer nav — these are body-content links with
// descriptive anchor text, which crawl + rank better and pass real
// internal PageRank to siblings (especially the under-impressioned
// AUS/CAN/JPN visa pages).
export default function RelatedPages({
  title = 'Related Pages',
  subtitle,
  links = [],
}) {
  if (!links.length) return null;

  return (
    <PrimarySection className="py-12 md:py-16 bg-gray-50/60 border-t border-gray-100">
      <Container>
        <SectionTitle
          textAlign="center"
          subtitle={subtitle}
          className="mb-8 md:mb-10"
        >
          {title}
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-2xl border border-gray-100 bg-white p-5 hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-primary-700 transition-colors mb-1.5 leading-snug">
                {link.anchor}
              </h3>
              {link.blurb && (
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {link.blurb}
                </p>
              )}
            </Link>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
