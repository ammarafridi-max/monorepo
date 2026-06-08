import Container from '../Container';
import PrimarySection from '../PrimarySection';
import SectionTitle from '../SectionTitle';
import FAQAccordion from '../FAQAccordion';
import PrimaryLink from '../PrimaryLink';

export default function FAQs({ title = 'Frequently Asked Questions', subtitle = 'FAQs', faqs = [], includeJsonLd = true }) {
  const visibleFaqs = faqs.slice(0, 8);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: visibleFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq?.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq?.answer,
      },
    })),
  };

  return (
    <>
      <PrimarySection className="py-15 lg:py-30">
        <Container>
          <SectionTitle textAlign="center" subtitle={subtitle}>
            {title}
          </SectionTitle>
          <div className="mt-12 flex flex-col gap-5 overflow-x-scroll lg:overflow-x-visible">
            {visibleFaqs.map((faq, i) => (
              <FAQAccordion key={i} question={faq?.question}>
                {faq?.answer}
              </FAQAccordion>
            ))}
          </div>
          <div className="flex items-center justify-center mt-7">
            <PrimaryLink to="/frequently-asked-questions">Read More FAQs</PrimaryLink>
          </div>
        </Container>
      </PrimarySection>
      {includeJsonLd && visibleFaqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
    </>
  );
}
