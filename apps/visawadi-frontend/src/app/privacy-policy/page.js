import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import PageHero from '@travel-suite/frontend-shared/components/sections/v1/PageHero';
import { buildMetadata } from '@/lib/schema';

export const pageData = {
  meta: {
    title: 'Privacy Policy',
    description:
      'Read the official Privacy Policy of VisaWadi to understand how we collect, protect, and use your personal data.',
    canonical: 'https://www.visawadi.com/privacy-policy',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
  ],
  sections: {
    hero: {
      title: 'Privacy Policy',
      subtitle:
        'At VisaWadi, your privacy is extremely important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website (https://www.visawadi.com) and our services.',
      points: ['No Data Selling', 'Secure Storage', 'Your Rights Protected', 'UAE Governed'],
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
        points={pageData.sections.hero.points ?? []}
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

          <SectionTitle className="mt-10">Cookies, Analytics &amp; Session Recording</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              We use cookies and third-party analytics tools, such as Google Analytics, to understand
              how visitors use our website and to improve our services.
            </li>
            <li className="pl-2">
              We also use Microsoft Clarity to understand how visitors interact with our pages.
              Clarity may record anonymised session data, such as pages visited, clicks, taps,
              scrolling and mouse movement, and produce aggregated heatmaps. It masks the text you
              type into form fields by default, including contact, passport and payment details. We
              use this data only in aggregate to improve usability, never to identify you personally.
            </li>
            <li className="pl-2">
              Microsoft describes how Clarity handles this data in its privacy statement
              (https://privacy.microsoft.com/privacystatement). You can also limit collection by
              enabling &quot;Do Not Track&quot; in your browser.
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
              contacting us at info@visawadi.com.
            </li>
            <li className="pl-2">
              You may opt out of marketing communications at any time by using the unsubscribe link
              in our emails.
            </li>
          </ul>

          <SectionTitle className="mt-10">Changes to This Privacy Policy</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              VisaWadi reserves the right to update or modify this Privacy Policy at any
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
            <li className="pl-2">Email: info@visawadi.com</li>
            <li className="pl-2">
              Address: Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates
            </li>
          </ul>
        </Container>
      </PrimarySection>
    </>
  );
}
