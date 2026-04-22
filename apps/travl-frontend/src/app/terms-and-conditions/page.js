import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/v1/layout/SectionTitle';
import PageHero from '@travel-suite/frontend-shared/components/v1/sections/PageHero';
import { buildMetadata } from '@/lib/publicMetadata';

export const pageData = {
  meta: {
    title: 'Terms & Conditions - Travl',
    description:
      'Read the official Terms & Conditions of Travl to understand service usage, refunds, legal responsibility, and policies.',
    canonical: 'https://www.travl.ae/terms-and-conditions',
  },
  breadcrumb: [
    { label: 'Home', path: '/' },
    { label: 'Terms & Conditions', path: '/terms-and-conditions' },
  ],
  sections: {
    hero: {
      title: 'Terms & Conditions',
      subtitle:
        'Welcome to Travl. By using our website (https://www.travl.ae) or purchasing any service from us, you agree to comply with the Terms & Conditions below. Please read them carefully before proceeding.',
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

      <PrimarySection className="py-12.5">
        <Container>
          <SectionTitle className="mt-10">General Information</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              Travl provides travel-related services including dummy flight tickets,
              travel itineraries, and supporting travel documentation for visa applications and
              travel planning purposes.
            </li>
            <li className="pl-2">
              Our services are intended for legitimate use only. Misuse for fraudulent or illegal
              purposes is strictly prohibited and may result in legal action.
            </li>
            <li className="pl-2">
              These Terms & Conditions apply to all visitors, users, and customers of Travl.
            </li>
          </ul>

          <SectionTitle className="mt-10">Use of Services</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              By using our website, you confirm that you are at least 18 years old or have
              parental/guardian consent.
            </li>
            <li className="pl-2">
              You agree to use our services only for lawful and legitimate purposes.
            </li>
            <li className="pl-2">
              You acknowledge that flight reservations are not confirmed airline tickets and cannot be used for
              boarding or actual air travel.
            </li>
            <li className="pl-2">
              Travl reserves the right to refuse service to users engaging in fraudulent,
              abusive, or illegal activities.
            </li>
          </ul>

          <SectionTitle className="mt-10">Payments & Refund Policy</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              All payments must be made through the secure payment options provided on our website.
            </li>
            <li className="pl-2">
              All payments are non-refundable except in cases of system failure or when the service
              is not delivered as described.
            </li>
            <li className="pl-2">
              If you experience any issue, you must contact us within 24 hours of purchase for
              review.
            </li>
          </ul>

          <SectionTitle className="mt-10">User Responsibilities</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              You are responsible for providing accurate and complete information when placing an
              order.
            </li>
            <li className="pl-2">
              Travl is not responsible for consequences arising from incorrect or
              incomplete user information.
            </li>
            <li className="pl-2">
              You agree not to misuse flight reservations for illegal or fraudulent purposes under any
              circumstances.
            </li>
          </ul>

          <SectionTitle className="mt-10">Intellectual Property</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              All content on Travl - including text, graphics, logos, and software - is
              owned by Travl and protected by copyright law.
            </li>
            <li className="pl-2">
              You may not copy, reproduce, distribute, or create derivative works without written
              permission.
            </li>
          </ul>

          <SectionTitle className="mt-10">Disclaimer of Liability</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              Travl does not guarantee visa approval or any outcome related to visa
              applications.
            </li>
            <li className="pl-2">
              We are not liable for direct, indirect, incidental, or consequential damages resulting
              from service use.
            </li>
            <li className="pl-2">
              It is your responsibility to ensure our documents meet the requirements of relevant
              authorities.
            </li>
          </ul>

          <SectionTitle className="mt-10">Privacy Policy</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              Your privacy is important to us. We only collect necessary information to process your
              order and deliver services.
            </li>
            <li className="pl-2">
              Full details are available in our
              <Link href="/privacy-policy" className="text-primary-500">
                {' '}
                Privacy Policy
              </Link>
              .
            </li>
          </ul>

          <SectionTitle className="mt-10">Amendments</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              Travl reserves the right to update or modify these Terms & Conditions
              without prior notice.
            </li>
            <li className="pl-2">
              Continued use of the website indicates acceptance of updated Terms.
            </li>
          </ul>

          <SectionTitle className="mt-10">Governing Law</SectionTitle>

          <ul className="text-md font-extralight flex flex-col gap-3 list-decimal pl-5">
            <li className="pl-2">
              These Terms & Conditions are governed by the laws of the United Arab Emirates.
            </li>
            <li className="pl-2">
              All disputes fall under the exclusive jurisdiction of UAE courts.
            </li>
          </ul>
        </Container>
      </PrimarySection>
    </>
  );
}
