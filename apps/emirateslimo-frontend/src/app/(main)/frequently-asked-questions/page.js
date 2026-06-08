import { chauffeurFaqs, brandFaqs, airportTransferFaqs } from '@/data/faqs';
import { allFaqsJsonLd } from '@/data/faqSchemas';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import SectionTitle from '@/components/SectionTitle';
import FAQAccordion from '@/components/FAQAccordion';
import PrimaryLink from '@/components/PrimaryLink';
import PageHero from '@/components/Sections/PageHero';

export const metadata = {
  title: 'FAQs | Emirates Limo Dubai Chauffeur & Transfers',
  description:
    'Find answers to commonly asked questions about Emirates Limo, our services, airport transfers, chauffeurs, and more. Contact us anytime for help.',
  alternates: { canonical: 'https://www.emirateslimo.com/frequently-asked-questions' },
  robots: { index: true, follow: true },
};

export default function FAQs() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(allFaqsJsonLd).replace(/</g, '\u003c') }}
      />

      <PageHero
        paths={[
          { label: 'Home', href: '/' },
          { label: 'Frequently Asked Questions', href: '/frequently-asked-questions' },
        ]}
        title="Frequently Asked Questions"
        subtitle="Everything You Need to Know"
      />

      <PrimarySection className="py-15 lg:py-20">
        <Container>

          {/* About Emirates Limo */}
          <div className="mb-16">
            <SectionTitle subtitle="Who We Are" textAlign="center" className="mb-8">
              About Emirates Limo
            </SectionTitle>
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
              {brandFaqs.map((faq, i) => (
                <FAQAccordion key={i} question={faq?.question}>
                  {faq?.answer}
                </FAQAccordion>
              ))}
            </div>
          </div>

          {/* Chauffeur Services */}
          <div className="mb-16">
            <SectionTitle subtitle="Private Drivers" textAlign="center" className="mb-8">
              Chauffeur Services
            </SectionTitle>
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
              {chauffeurFaqs.map((faq, i) => (
                <FAQAccordion key={i} question={faq?.question}>
                  {faq?.answer}
                </FAQAccordion>
              ))}
            </div>
            <div className="flex items-center justify-center mt-8">
              <PrimaryLink href="/chauffeur-service">Book Your Chauffeur</PrimaryLink>
            </div>
          </div>

          {/* Airport Transfers */}
          <div>
            <SectionTitle subtitle="Arrivals & Departures" textAlign="center" className="mb-8">
              Airport Transfers
            </SectionTitle>
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
              {airportTransferFaqs.map((faq, i) => (
                <FAQAccordion key={i} question={faq?.question}>
                  {faq?.answer}
                </FAQAccordion>
              ))}
            </div>
            <div className="flex items-center justify-center mt-8">
              <PrimaryLink href="/dubai-airport-transfer">Book Your Airport Transfer</PrimaryLink>
            </div>
          </div>

        </Container>
      </PrimarySection>
    </>
  );
}
