import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PageHero from '@/sections/PageHero';
import { SITE_URL } from '@/config';

export const metadata = {
  title: 'Privacy Policy – AirportRides',
  description:
    'Learn how AirportRides collects, uses, and protects your personal data when you book airport transfers worldwide.',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

const paths = [
  { label: 'Home', path: '/' },
  { label: 'Privacy Policy', path: '/privacy-policy' },
];

function Section({ heading, children }) {
  return (
    <div className="mt-12 first:mt-0">
      <h2 className="font-display text-2xl font-semibold text-ink mb-5 pb-3 border-b border-sand-300">
        {heading}
      </h2>
      <ul className="flex flex-col gap-3 text-ink-soft leading-relaxed list-none">
        {children}
      </ul>
    </div>
  );
}

function Item({ children }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-500" />
      <span>{children}</span>
    </li>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        title="Privacy Policy"
        subtitle="At AirportRides, your privacy matters. This policy explains how we collect, use, and protect your personal information when you use our website and transfer booking services."
        paths={paths}
      />

      <section className="py-16 md:py-20">
        <Container>
          <p className="text-sm text-ink-mute mb-10">Last updated: May 2025</p>
          <div className="max-w-3xl">

            <Section heading="Information We Collect">
              <Item>
                Personal details you provide when booking a transfer — including your name, email
                address, phone number, flight details, and pick-up/drop-off locations.
              </Item>
              <Item>
                Payment information is processed securely by our payment processors (Stripe) and
                is never stored on our servers.
              </Item>
              <Item>
                Non-personal data such as IP address, browser type, device information, and
                on-site behaviour, collected via cookies and analytics tools for service
                improvement.
              </Item>
            </Section>

            <Section heading="How We Use Your Information">
              <Item>To confirm and fulfil your transfer booking and keep you updated on its status.</Item>
              <Item>
                To send booking confirmations, driver details, and any service-related
                communications.
              </Item>
              <Item>
                To improve our platform, personalise your experience, and conduct internal
                analytics and research.
              </Item>
              <Item>
                To comply with legal obligations and prevent fraud or misuse of our services.
              </Item>
            </Section>

            <Section heading="Sharing Your Information">
              <Item>We do not sell, rent, or trade your personal data to third parties.</Item>
              <Item>
                Your booking details are shared with the assigned transfer operator only to the
                extent necessary to fulfil your journey.
              </Item>
              <Item>
                We may share information with trusted service providers (payment processors,
                cloud infrastructure, analytics) under strict data-processing agreements.
              </Item>
              <Item>
                We will disclose information where required by law, court order, or a competent
                regulatory authority.
              </Item>
            </Section>

            <Section heading="Cookies &amp; Tracking">
              <Item>
                We use essential cookies to keep your session active and your booking preferences
                saved during your visit.
              </Item>
              <Item>
                Analytics cookies (e.g. Google Analytics) help us understand how visitors use our
                site so we can improve the experience. These can be disabled via your browser
                settings.
              </Item>
              <Item>
                We may use pixel tracking for advertising measurement (Meta, Google Ads). You can
                opt out through those platforms&apos; ad preference centres.
              </Item>
            </Section>

            <Section heading="Data Security">
              <Item>
                We implement industry-standard security measures — including TLS encryption,
                access controls, and regular security reviews — to protect your data.
              </Item>
              <Item>
                While we take all reasonable steps to secure your information, no internet
                transmission is 100% guaranteed to be secure.
              </Item>
            </Section>

            <Section heading="Your Rights">
              <Item>
                You have the right to access, correct, or request deletion of any personal data we
                hold about you.
              </Item>
              <Item>
                You can opt out of marketing emails at any time using the unsubscribe link in any
                email we send.
              </Item>
              <Item>
                To exercise your rights, contact us at{' '}
                <a
                  href="mailto:info@airportrides.com"
                  className="text-clay-600 underline underline-offset-2"
                >
                  info@airportrides.com
                </a>
                . We will respond within 30 days.
              </Item>
            </Section>

            <Section heading="Data Retention">
              <Item>
                Booking records are retained for up to 7 years to comply with financial and legal
                obligations.
              </Item>
              <Item>
                Account data is deleted upon request or after 3 years of account inactivity,
                whichever comes first.
              </Item>
            </Section>

            <Section heading="Changes to This Policy">
              <Item>
                We may update this Privacy Policy from time to time. The &ldquo;last updated&rdquo; date at
                the top of this page will reflect any changes.
              </Item>
              <Item>
                Continued use of our website after changes are posted constitutes acceptance of
                the updated policy.
              </Item>
            </Section>

            <Section heading="Contact Us">
              <Item>
                If you have questions or concerns about this Privacy Policy, please reach out:
              </Item>
              <Item>
                Email:{' '}
                <a
                  href="mailto:info@airportrides.com"
                  className="text-clay-600 underline underline-offset-2"
                >
                  info@airportrides.com
                </a>
              </Item>
              <Item>Address: Dubai, United Arab Emirates</Item>
            </Section>

          </div>
        </Container>
      </section>
    </>
  );
}
