import ContentPage from '../../../components/ContentPage';
import { contentPageSchema } from '../../../lib/pageSchema';
import Sections from '../../../components/Sections';
import { privacy } from '../../../data/legal';

const META = {
  title: 'Privacy Policy: Your Photos and Data | Picturesk',
  description:
    'What Picturesk does with the selfies you upload to our AI Headshot Generator, how long we keep them, and how to have them deleted.',
  alternates: { canonical: '/privacy' },
};

export const metadata = META;

const SCHEMA = contentPageSchema({
  path: '/privacy',
  title: META.title,
  description: META.description,
  label: 'Privacy Policy',
});

export default function PrivacyPage() {
  return (
    <ContentPage
      schema={SCHEMA.graph}
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
