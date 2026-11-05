import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import PageHero from '@travel-suite/frontend-shared/components/sections/v1/PageHero';
import { buildMetadata } from '@/lib/schema';

export const pageData = {
  meta: {
    title: 'Privacy Policy - The Dummy Ticket AE',
    description:
      'Read the official Privacy Policy of The Dummy Ticket AE to understand how we collect, protect, and use your personal data.',
    canonical: 'https://www.thedummyticket.ae/privacy-policy',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
  ],
  sections: {
    hero: {
      title: 'Privacy Policy',
      subtitle:
        'At The Dummy Ticket AE, your privacy is extremely important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website (https://www.thedummyticket.ae) and our services.',
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
            <li className="pl-2">
              Two kinds of sharing need a fuller explanation, and you will find them in the next two
              sections: hashed contact details sent to advertising platforms, and marketing across
              the other travel brands we operate.
            </li>
          </ul>

          <SectionTitle className="mt-10">Advertising and Audience Matching</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              We advertise on platforms such as Meta, which runs Facebook and Instagram. To keep
              those ads relevant, we may share your contact details with them, specifically your
              email address, phone number, and name, in hashed form.
            </li>
            <li className="pl-2">
              Hashing turns each detail into a fixed, scrambled code before it leaves us, and the
              process cannot be reversed. The platform cannot read your email address, phone number,
              or name. It can only check whether our code matches a code it already holds for one of
              its own users.
            </li>
            <li className="pl-2">
              We use those matches to build advertising audiences: to show our ads to people who
              have bought from us, to reach new people whose profiles look similar (platforms call
              these lookalike audiences), and to exclude existing customers from ads they do not
              need to see.
            </li>
            <li className="pl-2">
              You can object to this at any time. Email info@thedummyticket.ae and ask to be removed from
              our marketing audiences, and we will take your details out of the audiences we
              control. You can also turn down ad personalisation in your own settings on the
              advertising platform.
            </li>
          </ul>

          <SectionTitle className="mt-10">Marketing Across Our Travel Brands</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              This website is one of several travel brands operated by the same company, at the
              address given at the end of this policy.
            </li>
            <li className="pl-2">
              Your contact details may be used for marketing across those other travel brands,
              including in the hashed advertising audiences described above, so that the travel
              offers you see are ones you are likely to want.
            </li>
            <li className="pl-2">
              This covers marketing only, not your booking or payment records, which stay with the
              brand you ordered from. One request is enough to stop it everywhere: email info@thedummyticket.ae
              and we will stop using your details for marketing across every brand we operate.
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
              contacting us at info@thedummyticket.ae.
            </li>
            <li className="pl-2">
              You may opt out of marketing communications at any time by using the unsubscribe link
              in our emails.
            </li>
          </ul>

          <SectionTitle className="mt-10">Changes to This Privacy Policy</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              The Dummy Ticket AE reserves the right to update or modify this Privacy Policy at any
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
            <li className="pl-2">Email: info@thedummyticket.ae</li>
            <li className="pl-2">
              Address: Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates
            </li>
          </ul>
        </Container>
      </PrimarySection>
    </>
  );
}
