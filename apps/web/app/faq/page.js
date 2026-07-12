import ContentPage from '../ContentPage';
import Sections from '../Sections';
import { faq } from '../../data/faq';

export const metadata = {
  title: 'FAQ. Picturesk.ai',
  description: 'Every question about Picturesk, answered: likeness, photos, timing, refunds, privacy, and usage rights.',
};

// The full FAQ, from the SAME data/faq.js the home page uses (one source of truth).
// Rendered as real question headings with direct answers, so it is easy to read
// and easy for AI to cite. Each Q becomes an <h2>, each answer a paragraph.
export default function FaqPage() {
  const sections = faq.map((item) => ({ h: item.q, body: [item.a] }));

  return (
    <ContentPage
      eyebrow="FAQ"
      title="Questions, answered."
      lede="Everything people ask before they buy. If your question is not here, our contact page is a click away."
    >
      <Sections sections={sections} />
    </ContentPage>
  );
}
