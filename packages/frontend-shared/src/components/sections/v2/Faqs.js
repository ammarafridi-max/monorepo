import Link from 'next/link';
import FaqAccordion from '../../ui/v2/FaqAccordion.js';
import PrimarySection from '../../shared/layout/PrimarySection.js';
import Container from '../../shared/layout/Container.js';

export default function Faqs({
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know before you go.',
  faqs = [],
}) {
  return (
    <PrimarySection className="py-20">
      <Container className="max-w-3xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        <p className="text-gray-500 mt-3">{subtitle}</p>
      </div>
      <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
        {faqs.map((faq, i) => (
          <FaqAccordion key={i} question={faq.question}>
            {faq.answer}
          </FaqAccordion>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-gray-400">
        Still have questions?{' '}
        <Link href="/contact" className="text-primary-700 font-medium hover:underline">
          Talk to our team →
        </Link>
      </p>
      </Container>
    </PrimarySection>
  );
}
