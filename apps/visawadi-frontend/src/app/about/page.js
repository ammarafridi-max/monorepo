import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';

export const metadata = {
  title: 'About Us — Visa Assistance for UAE Residents',
  description:
    'VisaWadi is a Dubai-based team that prepares visa applications for UAE residents. Document review, file preparation and appointment booking, tracked to a decision.',
  alternates: { canonical: 'https://www.visawadi.com/about' },
};

export default function AboutPage() {
  return (
    <PrimarySection className="py-14 md:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          About VisaWadi
        </h1>

        <p className="text-gray-600 leading-relaxed mb-4">
          VisaWadi is a Dubai-based team that does one thing: we prepare visa
          applications for UAE residents. Schengen, the UK, the US and Canada,
          plus France, Germany, Italy and Spain handled individually.
        </p>

        <p className="text-gray-600 leading-relaxed mb-4">
          Most refusals come down to document errors that were preventable. So a
          specialist reviews your file against what the embassy is asking for
          right now, writes the cover letter and financial summary, books your
          appointment at VFS Global or BLS International, and follows the
          application until your passport is back in your hands.
        </p>

        <p className="text-gray-600 leading-relaxed mb-4">
          We do not sell travel insurance, flight reservations or hotel
          bookings. When your file needs one of those, we tell you exactly what
          the embassy expects and where to get it.
        </p>

        <p className="text-gray-600 leading-relaxed mb-8">
          We are a small team and you can reach us directly. If you have a
          question about your application, we are an email away and usually
          reply within three minutes during business hours.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/visa"
            className="inline-flex items-center px-5 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
          >
            See the visas we handle
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
