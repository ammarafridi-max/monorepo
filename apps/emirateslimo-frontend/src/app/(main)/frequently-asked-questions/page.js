import { abuDhabiAirportFaqs, airportTransferFaqs, allFaqs, brandFaqs, chauffeurFaqs, dubaiTransferFaqs } from '@/data/faqs';
import { buildFAQPage, buildGraph, buildMetadata, buildOrganization, buildWebPage, buildWebsite } from '@/lib/schema';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import SectionTitle from '@/components/SectionTitle';
import FAQAccordion from '@/components/FAQAccordion';
import PrimaryLink from '@/components/PrimaryLink';
import PageHero from '@/components/Sections/PageHero';

export const pageData = {
  meta: {
    title: 'FAQs | Emirates Limo Dubai Chauffeur & Transfers',
    description:
      'Find answers to commonly asked questions about Emirates Limo, our services, airport transfers, chauffeurs, and more. Contact us anytime for help.',
    canonical: 'https://www.emirateslimo.com/frequently-asked-questions',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Frequently Asked Questions', href: '/frequently-asked-questions' },
  ],
  hero: { title: 'Frequently Asked Questions', subtitle: 'Everything You Need to Know' },
  groups: [
    { subtitle: 'Who We Are', title: 'About Emirates Limo', faqs: brandFaqs },
    {
      subtitle: 'Private Drivers',
      title: 'Chauffeur Services',
      faqs: chauffeurFaqs,
      cta: { href: '/chauffeur-service', label: 'Book Your Chauffeur' },
    },
    {
      subtitle: 'Arrivals & Departures',
      title: 'Dubai Airport Transfers',
      faqs: airportTransferFaqs,
      cta: { href: '/dubai-airport-transfer', label: 'Book Your Airport Transfer' },
    },
    {
      subtitle: 'Zayed International',
      title: 'Abu Dhabi Airport Transfers',
      faqs: abuDhabiAirportFaqs,
      cta: { href: '/abu-dhabi-airport-transfer', label: 'Book Abu Dhabi Airport Transfer' },
    },
    {
      subtitle: 'City & Intercity',
      title: 'Dubai Transfers',
      faqs: dubaiTransferFaqs,
      cta: { href: '/dubai-transfer', label: 'Book a Dubai Transfer' },
    },
  ],
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(pageData.meta),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: pageData.hero.title,
      description: pageData.meta.description,
      faqs: allFaqs,
    }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      <PageHero paths={pageData.breadcrumbPaths} title={pageData.hero.title} subtitle={pageData.hero.subtitle} />

      <PrimarySection className="py-15 lg:py-20">
        <Container>
          {pageData.groups.map((group, i) => (
            <div key={group.title} className={i === pageData.groups.length - 1 ? '' : 'mb-16'}>
              <SectionTitle subtitle={group.subtitle} className="mb-8">
                {group.title}
              </SectionTitle>
              <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                {group.faqs.map((faq) => (
                  <FAQAccordion key={faq.question} question={faq.question}>
                    {faq.answer}
                  </FAQAccordion>
                ))}
              </div>
              {group.cta && (
                <div className="flex items-center justify-center mt-8">
                  <PrimaryLink href={group.cta.href}>{group.cta.label}</PrimaryLink>
                </div>
              )}
            </div>
          ))}
        </Container>
      </PrimarySection>
    </>
  );
}
