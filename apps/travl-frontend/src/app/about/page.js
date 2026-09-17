import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import { buildGraph, buildOrganization, buildWebPage, buildWebsite } from '@/lib/schema';
import { ADDRESS, EMAIL, LEGAL_NAME, TRADE_LICENSE } from '@/config/contact';
import { DUMMY_TICKET_365, VISAWADI } from '@/config/partners';

const meta = {
  title: 'About Travl | Travel Insurance for UAE Residents',
  description:
    'Travl is a Dubai-licensed travel technology business selling AXA-issued travel insurance to UAE residents online, from AED 30, with the policy emailed in minutes.',
  canonical: 'https://www.travl.ae/about',
};

export const metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.canonical },
};

const facts = [
  ['Legal name', LEGAL_NAME],
  ['Licence', `Dubai Department of Economy and Tourism, E-Trader (Professional) licence ${TRADE_LICENSE}`],
  ['Office', ADDRESS],
  ['Insurer', 'AXA. Travl distributes the policy; AXA underwrites it and pays claims.'],
  ['Sells', 'Travel insurance and visa travel itineraries'],
  ['Does not sell', 'Visa applications, dummy flight tickets, hotel reservations'],
];

export default function AboutPage() {
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    { ...buildWebPage(meta), '@type': 'AboutPage' },
  ]);

  return (
    <PrimarySection className="py-14 md:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Container className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About Travl</h1>

        <p className="text-gray-600 leading-relaxed mb-4">
          Travl sells travel insurance to UAE residents online. Every policy is issued by AXA,
          starts from AED 30, and lands in your inbox within minutes of payment. That is the
          whole business, and we keep it that narrow on purpose.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">What Travl is</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          {LEGAL_NAME} is a sole establishment licensed by the Dubai Department of Economy and
          Tourism (licence {TRADE_LICENSE}) and based at {ADDRESS}. We are a distributor, not an
          insurer: you buy through our site, AXA underwrites the policy and handles any claim. Our
          job is to make the buying part fast and to make sure the certificate you get is the one
          a consulate, VFS Global or BLS International will accept.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">What we sell</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Single trip, annual multi-trip and family travel insurance, plus visa-specific plans that
          meet the EUR 30,000 medical minimum for Schengen and the requirements for UK, US, Canada
          and Australia visitor visas. The price depends on where you are going, your dates and how
          many people are travelling. We also generate day-by-day{' '}
          <Link href="/travel-itinerary" className="text-primary-700 underline">
            travel itineraries
          </Link>{' '}
          for visa applications.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">What we do not sell</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We do not prepare or file visa applications; that is{' '}
          <a href={VISAWADI.url} className="text-primary-700 underline" rel="noopener">
            {VISAWADI.name}
          </a>
          . We do not issue dummy flight tickets or hotel reservations; that is{' '}
          <a href={DUMMY_TICKET_365.url} className="text-primary-700 underline" rel="noopener">
            {DUMMY_TICKET_365.name}
          </a>
          . If a page on this site ever suggests otherwise, it is out of date and you should tell us.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Company details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-y-3 gap-x-4 text-gray-600 mb-8">
          {facts.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-medium text-gray-900">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-gray-600 leading-relaxed mb-8">
          We are a small team and you can reach us directly at {EMAIL} or on WhatsApp. If you have a
          question about a policy, a claim or a refund, a person answers.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/travel-insurance"
            className="inline-flex items-center px-5 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
          >
            Browse our insurance plans
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center px-5 py-3 rounded-xl border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 text-sm font-semibold transition-colors"
          >
            Contact us
          </Link>
        </div>
      </Container>
    </PrimarySection>
  );
}
