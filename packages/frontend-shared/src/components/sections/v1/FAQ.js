import Link from 'next/link';
import SectionTitle from '../../shared/layout/SectionTitle';
import PrimarySection from '../../shared/layout/PrimarySection';
import Container from '../../shared/layout/Container';
import FaqAccordion from '../../ui/v1/FaqAccordion';

export default function FAQ({
  title = 'Frequently Asked Questions',
  subtitle = 'Common questions answered',
  faqs,
}) {
  return (
    <PrimarySection id="faq" className="py-section">
      <Container>
        <SectionTitle align="center" subtitle={subtitle} className="mb-10 md:mb-12">
          {title}
        </SectionTitle>

        <div className="rounded-2xl border border-gray-200 overflow-hidden [&>*:last-child]:border-b-0">
          {faqs?.slice(0, 6).map((faq, i) => (
            <FaqAccordion key={i} question={faq.question}>
              {faq.answer}
            </FaqAccordion>
          ))}
        </div>

        <p className="mt-8 text-center text-[15px] text-gray-600">
          Still have questions?{' '}
          <Link
            href="/faq"
            className="text-primary-700 font-medium hover:underline"
          >
            Read all FAQs
          </Link>
        </p>
      </Container>
    </PrimarySection>
  );
}
