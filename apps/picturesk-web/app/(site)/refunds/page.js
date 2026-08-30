import ContentPage from '../../../components/ContentPage';
import Sections from '../../../components/Sections';
import { refunds } from '../../../data/legal';

export const metadata = {
  title: 'Refund Policy. Picturesk.ai',
  description: 'If a run fails, you are refunded automatically. What that covers, and what it does not.',
  alternates: { canonical: '/refunds' },
};

export default function RefundsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Refund Policy"
      updated={refunds.updated}
      lede={refunds.lede}
      contactNote
    >
      <Sections sections={refunds.sections} />
    </ContentPage>
  );
}
