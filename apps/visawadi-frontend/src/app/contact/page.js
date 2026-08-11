import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SocialLinks from '@travel-suite/frontend-shared/components/ui/v2/SocialLinks';
import { EMAIL, WHATSAPP_URL, ADDRESS, GMB_URL, SOCIALS } from '@/config/contact';

export const metadata = {
  title: 'Contact Us — Email, WhatsApp or Visit Our Dubai Office',
  description:
    'Get in touch with VisaWadi. Email info@visawadi.com, WhatsApp our team, or find us at Regus, DAFZ, Dubai for help with your insurance policy or visa documentation.',
  alternates: { canonical: 'https://www.visawadi.com/contact' },
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
            href={`mailto:${EMAIL}`}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
          >
            Email {EMAIL}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 text-sm font-semibold transition-colors"
          >
            WhatsApp us
          </a>
        </div>

        <div className="mt-12 grid gap-8 border-t border-gray-100 pt-10 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">
              Our office
            </h2>
            <address className="not-italic text-gray-700 leading-relaxed">
              {ADDRESS}
            </address>
            <a
              href={GMB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline"
            >
              View on Google Maps
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">
              Follow us
            </h2>
            <SocialLinks socials={SOCIALS} tone="light" />
          </div>
        </div>
      </Container>
    </PrimarySection>
  );
}
