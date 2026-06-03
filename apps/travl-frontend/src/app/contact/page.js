import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';

const WHATSAPP_NUMBER = '+971569964924';

export const metadata = {
  title: 'Contact Travl — Email or WhatsApp Our Team',
  description:
    'Get in touch with Travl. Email info@travl.ae or WhatsApp our team for help with your insurance policy or visa documentation.',
  alternates: { canonical: 'https://www.travl.ae/contact' },
};

export default function ContactPage() {
  return (
    <PrimarySection className="py-14 md:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Contact Us
        </h1>

        <p className="text-gray-600 leading-relaxed mb-4">
          The fastest way to reach us is email or WhatsApp. We answer both.
        </p>

        <p className="text-gray-600 leading-relaxed mb-8">
          For questions about an existing policy, please include your policy
          number. For help with a new application, just tell us what you're
          applying for and from where.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="mailto:info@travl.ae"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
          >
            Email info@travl.ae
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 text-sm font-semibold transition-colors"
          >
            WhatsApp us
          </a>
        </div>
      </Container>
    </PrimarySection>
  );
}
