import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import FAQAccordion from '@travel-suite/frontend-shared/components/v1/FAQAccordion';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';
import PageHero from '@travel-suite/frontend-shared/components/v1/sections/PageHero';
import { insuranceFaqs } from '@/data/faqs';
import { buildMetadata } from '@/lib/publicMetadata';
import {
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

export const faqPageData = {
  meta: {
    title: 'Travel Insurance FAQ | Common Questions Answered | Travl',
    description:
      'Get clear answers to common questions about travel insurance coverage, Schengen requirements, policy delivery, visa applications, and more.',
    canonical: 'https://www.travl.ae/faq',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'FAQs', path: '/faq' },
  ],
  sections: {
    hero: {
      title: 'Frequently Asked Questions',
      subtitle:
        'Everything you need to know about travel insurance — coverage requirements, policy delivery, Schengen compliance, and how to get the right plan for your visa application.',
    },
  },
};

export const metadata = buildMetadata(faqPageData.meta);

export default function Page() {
  const faqs = insuranceFaqs;
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(faqPageData.meta),
    buildFAQPage({
      canonical: faqPageData.meta.canonical,
      title: faqPageData.sections.hero.title,
      description: faqPageData.meta.description,
      faqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <PageHero
        paths={faqPageData?.breadcrumb}
        title={faqPageData?.sections?.hero?.title}
        subtitle={faqPageData?.sections?.hero?.subtitle}
      />
      <PrimarySection className="py-10 lg:py-15 bg-white">
        <Container>
          <div className="flex flex-col lg:items-center lg:justify-center lg:max-w-240 lg:mx-auto gap-5">
            {faqs.map((faq, i) => (
              <FAQAccordion key={i} question={faq?.question}>
                {faq.answer}
              </FAQAccordion>
            ))}
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
