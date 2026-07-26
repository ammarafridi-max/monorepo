import ContentPage from '../../components/ContentPage';
import Sections from '../../components/Sections';
import { privacy } from '../../data/legal';

export const metadata = {
  title: 'Privacy Policy. Picturesk.ai',
  description: 'What Picturesk collects, how it is used, and the processors we work with.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated={privacy.updated}
      lede={privacy.lede}
      contactNote
    >
      {/* TODO: confirm data storage region and retention policy (see data/legal.js). */}
      <Sections sections={privacy.sections} />
    </ContentPage>
  );
}
