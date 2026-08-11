import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v2/FaqAccordion';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import PageHero from '@travel-suite/frontend-shared/components/sections/v1/PageHero';
import { faqPageFaqs } from '@/data/faqs';
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
    title: 'Visa Assistance FAQ | Common Questions Answered | VisaWadi',
    description:
      'Clear answers on visa requirements, processing times, refusals, embassy fees and what our service covers for UAE residents.',
    canonical: 'https://www.visawadi.com/faq',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'FAQs', path: '/faq' },
  ],
  sections: {
    hero: {
      title: 'Frequently Asked Questions',
      subtitle:
        'Everything you need to know about applying: what documents your embassy wants, how long a decision takes, what happens after a refusal, and what our service actually covers.',
      points: ['Documents', 'Processing Times', 'Refusals', 'Fees'],
    },
  },
};

export const metadata = buildMetadata(faqPageData.meta);

export default function Page() {
  const faqs = faqPageFaqs;
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
        points={faqPageData?.sections?.hero?.points ?? []}
      />
      <PrimarySection className="py-10 lg:py-15 bg-white">
        <Container>
          <div className="lg:max-w-240 lg:mx-auto rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_4px_rgba(16,24,40,0.04)] overflow-hidden">
            {faqs.map((faq, i) => (
              <FaqAccordion key={i} question={faq?.question}>
                {faq.answer}
              </FaqAccordion>
            ))}
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
