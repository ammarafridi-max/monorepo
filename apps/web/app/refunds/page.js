import ContentPage from '../ContentPage';
import Sections from '../Sections';
import { refunds } from '../../data/legal';

export const metadata = {
  title: 'Refund Policy. Picturesk.ai',
  description: 'If a run fails, you are refunded automatically. What that covers, and what it does not.',
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
