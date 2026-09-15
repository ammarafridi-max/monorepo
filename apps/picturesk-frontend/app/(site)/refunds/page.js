import ContentPage from '../../../components/ContentPage';
import { contentPageSchema } from '../../../lib/pageSchema';
import Sections from '../../../components/Sections';
import { refunds } from '../../../data/legal';

const META = {
  title: 'Refund Policy and Look-Like-You Guarantee | Picturesk',
  description:
    'If an AI headshot run fails you are refunded automatically. What that covers, what the look-like-you guarantee covers, and how to claim.',
  alternates: { canonical: '/refunds' },
};

export const metadata = META;

const SCHEMA = contentPageSchema({
  path: '/refunds',
  title: META.title,
  description: META.description,
  label: 'Refund Policy',
});

export default function RefundsPage() {
  return (
    <ContentPage
      schema={SCHEMA.graph}
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
