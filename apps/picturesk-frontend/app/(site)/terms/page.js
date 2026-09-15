import ContentPage from '../../../components/ContentPage';
import { contentPageSchema } from '../../../lib/pageSchema';
import Sections from '../../../components/Sections';
import { terms } from '../../../data/legal';

const META = {
  title: 'Terms of Service | Picturesk AI Headshot Generator',
  description:
    'The terms you agree to when you buy AI headshots from Picturesk: what we deliver, what you may do with the results, and your rights.',
  alternates: { canonical: '/terms' },
};

export const metadata = META;

const SCHEMA = contentPageSchema({
  path: '/terms',
  title: META.title,
  description: META.description,
  label: 'Terms of Service',
});

export default function TermsPage() {
  return (
    <ContentPage
      schema={SCHEMA.graph}
      eyebrow="Legal"
      title="Terms of Service"
      updated={terms.updated}
      lede={terms.lede}
      contactNote
    >
      {/* TODO: confirm governing law / jurisdiction (UAE?) (see data/legal.js). */}
      <Sections sections={terms.sections} />
    </ContentPage>
  );
}
