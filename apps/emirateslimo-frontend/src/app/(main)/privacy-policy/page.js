import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import PageHeading from '@/components/PageHeading';
import SectionTitle from '@/components/SectionTitle';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Emirates Limo collects, uses, and protects your personal data when you book chauffeur services or airport transfers in the UAE.',
  alternates: { canonical: 'https://www.emirateslimo.com/privacy-policy' },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicy() {
  return (
    <>
      <PrimarySection className="py-10 lg:py-15 bg-gray-100 text-black">
        <Container>
          <div className="flex flex-col items-start">
            <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy', href: '/privacy-policy' }]} />
            <PageHeading className="text-[32px] lg:text-[44px] font-light leading-[1.1] mb-5">Privacy Policy</PageHeading>
            <p className="text-gray-600 text-base lg:text-lg font-extralight">
              At Emirates Limo, your privacy is of utmost importance to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website (https://www.emirateslimo.com) or book any of our services.
            </p>
          </div>
        </Container>
      </PrimarySection>

      <PrimarySection className="py-12.5">
        <Container>
          <SectionTitle className="my-10">Information We Collect</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2"><strong>Personal Information:</strong> This includes your full name, phone number, email address, pickup and drop-off locations, flight details, and any additional information required to complete your booking.</li>
              <li className="pl-2"><strong>Payment Information:</strong> Payments are processed securely through third-party providers such as Stripe. We do not store your card details on our servers.</li>
              <li className="pl-2"><strong>Website Usage Data:</strong> We collect analytics data such as pages visited, device information, browser type, IP address, and interaction behavior to improve website performance.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">How We Use Your Information</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2">To process and confirm your booking.</li>
              <li className="pl-2">To contact you regarding booking updates, chauffeur details, or service changes.</li>
              <li className="pl-2">To enhance your user experience by optimizing website performance and user interface.</li>
              <li className="pl-2">To maintain security, prevent fraudulent activity, and ensure compliance with UAE regulations.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">Data Sharing and Disclosure</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2">We share your necessary booking details with our licensed chauffeurs and transportation partners to deliver the service.</li>
              <li className="pl-2">Payment data is processed securely by third-party providers such as Stripe and is never stored by us.</li>
              <li className="pl-2">We do not sell, trade, or rent your personal information to any third parties.</li>
              <li className="pl-2">We may disclose information only when required by UAE law, legal process, or government authorities.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">Data Security</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2">We implement industry-standard security measures to protect your data from unauthorized access, alteration, or misuse.</li>
              <li className="pl-2">Only authorized staff and partners have limited access to your information strictly for service fulfillment.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">Cookies and Tracking Technologies</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2">Our website uses cookies to improve functionality, track performance, and enhance your browsing experience.</li>
              <li className="pl-2">You can disable cookies through your browser settings, but doing so may affect website usability.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">Your Rights</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2">You may request access to the personal information we hold about you.</li>
              <li className="pl-2">You may request corrections if any data is inaccurate or incomplete.</li>
              <li className="pl-2">You may request deletion of your data where legally permissible.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">Data Retention</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2">We retain personal information only as long as necessary to fulfill our services, comply with legal obligations, or resolve disputes.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">Third-Party Links</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2">Our website may contain links to third-party websites. We are not responsible for their privacy practices or content.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">Updates to This Privacy Policy</SectionTitle>
          <p className="text-xl font-extralight">
            <ul className="flex flex-col gap-3 list-decimal pl-5">
              <li className="pl-2">Emirates Limo reserves the right to update this Privacy Policy at any time. Changes will be reflected on this page with an updated revision date.</li>
            </ul>
          </p>

          <SectionTitle className="my-10">Contact Us</SectionTitle>
          <p className="text-xl font-extralight leading-10">
            If you have questions about this Privacy Policy or wish to request any data changes, you may contact us at:<br />
            <strong>Email:</strong> contact@emirateslimo.com<br />
            <strong>Phone:</strong> +971 56 996 4924
          </p>
        </Container>
      </PrimarySection>
    </>
  );
}
