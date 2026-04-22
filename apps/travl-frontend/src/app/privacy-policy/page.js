import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/v1/layout/SectionTitle';
import PageHero from '@travel-suite/frontend-shared/components/v1/sections/PageHero';
import { buildMetadata } from '@/lib/publicMetadata';

export const pageData = {
  meta: {
    title: 'Privacy Policy - Travl',
    description:
      'Read the official Privacy Policy of Travl to understand how we collect, protect, and use your personal data.',
    canonical: 'https://www.travl.ae/privacy-policy',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
  ],
  sections: {
    hero: {
      title: 'Privacy Policy',
      subtitle:
        'At Travl, your privacy is extremely important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website (https://www.travl.ae) and our services.',
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  return (
    <>
      <PageHero
        paths={pageData.breadcrumb}
        title={pageData.sections.hero.title}
        subtitle={pageData.sections.hero.subtitle}
      />

      <PrimarySection className="py-8">
        <Container>
          <SectionTitle className="mt-10">Information We Collect</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              We collect personal information that you provide when placing an order, including your
              name, email address, phone number, and booking details.
            </li>
            <li className="pl-2">
              Payment information is processed securely by third-party payment gateways and is not
              stored on our servers.
            </li>
            <li className="pl-2">
              We may also collect non-personal data such as IP address, browser type, and device
              information for analytics and website improvement.
            </li>
          </ul>

          <SectionTitle className="mt-10">How We Use Your Information</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">To process your order and deliver the services you requested.</li>
            <li className="pl-2">
              To communicate with you regarding your booking, updates, or support requests.
            </li>
            <li className="pl-2">
              To improve our website, services, performance, and overall user experience through
              analytics.
            </li>
          </ul>

          <SectionTitle className="mt-10">Sharing Your Information</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              We do not sell, rent, or trade your personal information with third parties.
            </li>
            <li className="pl-2">
              Information may be shared only with trusted third parties such as payment processors
              or service providers strictly for fulfilling your order.
            </li>
            <li className="pl-2">
              We may disclose information if required to do so by law or governmental authority.
            </li>
          </ul>

          <SectionTitle className="mt-10">Data Security</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              We implement appropriate security measures to protect your personal information from
              unauthorized access, alteration, or disclosure.
            </li>
            <li className="pl-2">
              However, no method of data transmission over the internet is completely secure;
              therefore absolute security cannot be guaranteed.
            </li>
          </ul>

          <SectionTitle className="mt-10">Your Rights</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              You have the right to access, correct, or request deletion of your personal data by
              contacting us at info@travl.ae.
            </li>
            <li className="pl-2">
              You may opt out of marketing communications at any time by using the unsubscribe link
              in our emails.
            </li>
          </ul>

          <SectionTitle className="mt-10">Changes to This Privacy Policy</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              Travl reserves the right to update or modify this Privacy Policy at any
              time without prior notice.
            </li>
            <li className="pl-2">
              Any changes become effective immediately upon posting on our website.
            </li>
          </ul>

          <SectionTitle className="mt-10">Contact Us</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              If you have any questions or concerns regarding this Privacy Policy, please contact
              us:
            </li>
            <li className="pl-2">Email: info@travl.ae</li>
            <li className="pl-2">
              Address: Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates
            </li>
          </ul>
        </Container>
      </PrimarySection>
    </>
  );
}
