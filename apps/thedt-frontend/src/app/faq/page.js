import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import PageHero from '@travel-suite/frontend-shared/components/sections/v1/PageHero';
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
    title: 'Dummy Ticket FAQ | Common Questions Answered',
    description:
      'How long a reservation stays live, how to verify the PNR yourself, what delivery actually takes, and when we refund. Answered plainly.',
    canonical: 'https://www.thedummyticket.ae/faq',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'FAQs', path: '/faq' },
  ],
  sections: {
    hero: {
      title: 'Frequently Asked Questions',
      subtitle:
        'The questions people actually email us before they book: how long it lasts, how to check it is real, what happens when an appointment moves, and when we give money back. If yours is not here, write to us and we will answer it.',
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
