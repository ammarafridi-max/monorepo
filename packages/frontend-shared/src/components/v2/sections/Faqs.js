import Link from 'next/link';
import FaqAccordion from '../ui/FaqAccordion.js';

export default function Faqs({
  title = 'Frequently Asked Questions',
  description = 'Everything you need to know before you go.',
}) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20 w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        <p className="text-gray-500 mt-3">{description}</p>
      </div>
      <FaqAccordion />
      <p className="mt-8 text-center text-sm text-gray-400">
        Still have questions?{' '}
        <Link
          href="/contact"
          className="text-primary-700 font-medium hover:underline"
        >
          Talk to our team →
        </Link>
      </p>
    </section>
  );
}
