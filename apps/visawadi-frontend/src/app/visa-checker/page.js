import VisaChecker from '@travel-suite/frontend-shared/components/sections/v1/VisaChecker';
import {
  SITE_URL,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

const meta = {
  title: 'Do I Need a Visa? Free Visa Requirement Checker | VisaWadi',
  description:
    'Check whether you need a visa in seconds. Enter your nationality, where you live and where you are going. Built for UAE residents, because a residence permit changes the answer.',
  canonical: `${SITE_URL}/visa-checker`,
};

export const metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.canonical },
  robots: { index: true, follow: true },
  openGraph: { url: meta.canonical, title: meta.title, description: meta.description },
};

export default function Page() {
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: meta.canonical, title: meta.title, description: meta.description }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <VisaChecker
        // Schengen is sold as one product but is not a country, so it is offered
        // as a destination alongside the ISO list.
        extraDestinations={[{ code: 'XS', name: 'Schengen Area (any of the 29 countries)' }]}
      />
    </>
  );
}
