import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';

export const metadata = {
  title: 'About Travl — Travel Documentation & Insurance for UAE Residents',
  description:
    'Travl Technologies LLC is a Dubai-based travel agency helping UAE residents with embassy-compliant insurance and visa documentation since 2018.',
  alternates: { canonical: 'https://www.travl.ae/about' },
};

export default function AboutPage() {
  return (
    <PrimarySection className="py-14 md:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          About Travl
        </h1>

        <p className="text-gray-600 leading-relaxed mb-4">
          Travl Technologies LLC is a Dubai-based travel agency. We've been
          helping UAE residents put together the paperwork they need for visa
          applications since 2018.
        </p>

        <p className="text-gray-600 leading-relaxed mb-4">
          Our travel insurance policies are underwritten by AXA. They meet the
          requirements of European Schengen consulates and are accepted by VFS
          Global and BLS International across the UAE.
        </p>

        <p className="text-gray-600 leading-relaxed mb-8">
          We're a small team and you can reach us directly. If you have a
          question about a policy or your application, we're an email away.
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
