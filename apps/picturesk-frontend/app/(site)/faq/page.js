import ContentPage from '../../../components/ContentPage';
import { contentPageSchema } from '../../../lib/pageSchema';
import { buildFAQPage, SITE_URL } from '../../../lib/schema';
import Sections from '../../../components/Sections';
import { faq } from '../../../data/faq';

const META = {
  title: 'AI Headshot FAQ: Photos, Timing, Refunds | Picturesk',
  description:
    'Every question about our AI Headshot Generator, answered: likeness, how many photos, timing, refunds, privacy, and usage rights.',
  alternates: { canonical: '/faq' },
};

export const metadata = META;

const SCHEMA = contentPageSchema({
  path: '/faq',
  title: META.title,
  description: META.description,
  label: 'FAQ',
    extra: [
      buildFAQPage({
        canonical: `${SITE_URL}/faq`,
        title: META.title,
        description: META.description,
        faqs: faq.map((item) => ({ question: item.q, answer: item.a })),
      }),
    ],
});

// The full FAQ, from the SAME data/faq.js the home page uses (one source of truth).
// Rendered as real question headings with direct answers, so it is easy to read
// and easy for AI to cite. Each Q becomes an <h2>, each answer a paragraph.
export default function FaqPage() {
  const sections = faq.map((item) => ({ h: item.q, body: [item.a] }));

  return (
    <ContentPage
      schema={SCHEMA.graph}
      eyebrow="FAQ"
      title="Questions, answered."
      lede="Everything people ask before they buy. If your question is not here, our contact page is a click away."
    >
      <Sections sections={sections} />
    </ContentPage>
  );
}
