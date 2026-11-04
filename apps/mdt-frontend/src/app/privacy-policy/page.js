import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import PageHero from '@travel-suite/frontend-shared/components/sections/v1/PageHero';
import { buildMetadata } from '@/lib/schema';

export const pageData = {
  meta: {
    title: 'Privacy Policy - My Dummy Ticket',
    description:
      'Read the official Privacy Policy of My Dummy Ticket to understand how we collect, protect, and use your personal data.',
    canonical: 'https://www.mydummyticket.ae/privacy-policy',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
  ],
  sections: {
    hero: {
      title: 'Privacy Policy',
      subtitle:
        'At My Dummy Ticket, your privacy is extremely important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website (https://www.mydummyticket.ae) and our services.',
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
              We do not sell, rent, or trade your personal information for money. We do share
              some of it in the limited ways set out in this policy, including the hashed
              advertising audiences described below.
            </li>
            <li className="pl-2">
              Information may be shared only with trusted third parties such as payment processors
              or service providers strictly for fulfilling your order.
            </li>
            <li className="pl-2">
              We may disclose information if required to do so by law or governmental authority.
            </li>
            <li className="pl-2">
              Two kinds of sharing are set out in full in the next two sections: hashed contact
              details sent to advertising platforms, and marketing across the other travel brands we
              operate.
            </li>
          </ul>

          <SectionTitle className="mt-10">Advertising and Audience Matching</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              We run ads on platforms such as Meta, the company behind Facebook and Instagram. So
              that those ads reach the right people, we may share your email address, phone number,
              and name with them in hashed form.
            </li>
            <li className="pl-2">
              Hashing converts each detail into a scrambled code before we send it, and that code
              cannot be turned back into the original. The platform never reads your email address,
              phone number, or name. It only checks whether our code matches a code it already has
              for one of its users.
            </li>
            <li className="pl-2">
              Those matches let us build advertising audiences: showing ads to people who have
              ordered from us, finding new customers whose profiles are similar to theirs, which
              platforms call lookalike audiences, and leaving existing customers out of ads they do
              not need to see.
            </li>
            <li className="pl-2">
              You can object to any of this. Email info@mydummyticket.ae and ask to be removed from
              our marketing audiences, and we will take your details out of every audience we
              control. You can also switch off ad personalisation in your settings on the
              advertising platform itself.
            </li>
          </ul>

          <SectionTitle className="mt-10">Marketing Across Our Travel Brands</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              The same company operates more than one travel brand, from the address at the end of
              this policy, and this website is one of them.
            </li>
            <li className="pl-2">
              We may use your contact details to market those other travel brands to you, including
              by putting them in the hashed advertising audiences described above, so the travel
              offers you see are relevant to you.
            </li>
            <li className="pl-2">
              This is about marketing only. Your order and payment records stay with the brand you
              bought from. A single request stops the marketing everywhere: email
              info@mydummyticket.ae and we will stop using your details for marketing across every
              brand we operate.
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
              contacting us at info@mydummyticket.ae.
            </li>
            <li className="pl-2">
              You may opt out of marketing communications at any time by using the unsubscribe link
              in our emails.
            </li>
          </ul>

          <SectionTitle className="mt-10">Changes to This Privacy Policy</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              My Dummy Ticket reserves the right to update or modify this Privacy Policy at any
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
            <li className="pl-2">Email: info@mydummyticket.ae</li>
            <li className="pl-2">
              Address: Abraj Al Mamzar, Al Mamzar, Dubai, United Arab Emirates
            </li>
          </ul>
        </Container>
      </PrimarySection>
    </>
  );
}
