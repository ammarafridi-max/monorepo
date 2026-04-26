import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import FAQAccordion from '@travel-suite/frontend-shared/components/v1/ui/FAQAccordion';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/layout/PrimarySection';
import PageHero from '@travel-suite/frontend-shared/components/v1/sections/PageHero';
import { faqArray, formatFaqArray } from '@/data/faqs';
import { buildMetadata } from '@/lib/schema';
import {
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

export const faqPageData = {
  meta: {
    title: 'Dummy Ticket FAQ | Common Questions Answered | Dummy Ticket 365',
    description:
      'Get clear answers to common questions about dummy ticket validity, verification, delivery time, refunds, and visa document usage.',
    canonical: 'https://www.dummyticket365.com/faq',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'FAQs', path: '/faq' },
  ],
  sections: {
    hero: {
      title: 'Frequently Asked Questions',
      subtitle:
        'Our FAQs section answers the most common questions about dummy tickets, including validity, usage, and verification. It’s designed to give you clear, quick, and reliable information so you can proceed with confidence.',
    },
  },
};

export const metadata = buildMetadata(faqPageData.meta);

export default function Page() {
  const faqs = formatFaqArray(faqArray, 'dummy ticket');
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
