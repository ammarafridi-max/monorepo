import ContentPage from '../../components/ContentPage';
import Sections from '../../components/Sections';
import { terms } from '../../data/legal';

export const metadata = {
  title: 'Terms of Service. Picturesk.ai',
  description: 'The terms for using Picturesk: eligibility, acceptable use, payment, refunds, and your rights.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <ContentPage
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
