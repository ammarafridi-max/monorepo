import Link from 'next/link';
import AllForms from '@travel-suite/frontend-shared/components/v1/forms/AllForms';
import Container from '@travel-suite/frontend-shared/components/v1/layout/Container';
import FAQAccordion from '@travel-suite/frontend-shared/components/v1/FAQAccordion';
import PrimarySection from '@travel-suite/frontend-shared/components/v1/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/v1/layout/SectionTitle';
import About from '@travel-suite/frontend-shared/components/v1/sections/About';
import Hero from '@travel-suite/frontend-shared/components/v1/sections/Hero';
import Process from '@travel-suite/frontend-shared/components/v1/sections/Process';
import { buildMetadata } from '@/lib/publicMetadata';
import {
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

export const processSteps = [
  {
    title: 'Enter Your Trip Details',
    text: 'Select your policy start date, destination region, and number of travelers. Annual plans cover all trips within your chosen region for 12 months from the start date.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued correctly.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Complete your payment securely online and receive your annual multi-trip travel insurance policy by email within minutes. Your coverage begins on your chosen start date.',
  },
];

const reasons = [
  {
    title: 'One Policy for the Whole Year',
    text: 'Pay once and stay covered for every trip you take over the next 12 months. There is no need to arrange new insurance before each departure.',
  },
  {
    title: 'Covers Multiple Destinations',
    text: 'Annual plans can cover specific regions or worldwide travel, so you are protected whether you are visiting Europe, Asia, or anywhere else.',
  },
  {
    title: 'Schengen-Compliant for Every European Trip',
    text: 'Our annual plans meet the travel insurance requirements for Schengen visa applications, so you can use the same policy for multiple European trips throughout the year.',
  },
  {
    title: 'Annual Holiday Insurance vs Single-Trip',
    text: 'If you travel more than twice a year, an annual plan typically works out cheaper than buying a new single-trip policy each time you travel.',
  },
  {
    title: 'Issued by AXA',
    text: 'Every annual policy is underwritten and issued by AXA. Your certificate is genuine, legally valid, and accepted for embassy submissions and actual medical claims.',
  },
  {
    title: 'Instant Policy Delivery',
    text: 'Pay online and receive your annual travel insurance certificate by email immediately. Your coverage begins from the date you select.',
  },
];

export const faqs = [
  {
    question: 'What is annual multi-trip travel insurance?',
    answer:
      'Annual multi-trip travel insurance is a single policy that covers all your international trips within a 12-month period. You buy it once and it applies to every trip you take, up to the maximum trip duration specified in your plan.',
  },
  {
    question: 'How is yearly travel insurance different from single-trip cover?',
    answer:
      'A single-trip policy covers one specific journey between set dates. An annual multi-trip policy covers all trips within a year, which typically makes it more cost-effective if you travel more than once or twice annually.',
  },
  {
    question: 'Is annual multi-trip insurance Schengen compliant?',
    answer:
      'Yes. Our annual plans include the required medical coverage for Schengen visa applications and are accepted by embassies and visa centres including VFS and BLS.',
  },
  {
    question: 'How many trips can I take on an annual plan?',
    answer:
      'Annual plans typically cover an unlimited number of trips per year, subject to a maximum duration per individual trip. The exact limit depends on the plan you select.',
  },
  {
    question: 'Does multi-trip insurance UAE cover worldwide destinations?',
    answer:
      'Yes. You can choose a plan that covers specific regions or worldwide destinations, depending on where you travel throughout the year.',
  },
  {
    question: 'How quickly will I receive my annual insurance policy?',
    answer:
      'Your policy is issued instantly and delivered to your email within minutes of successful payment. No office visit is required.',
  },
];

export const pageData = {
  meta: {
    title: 'Annual Multi-Trip Travel Insurance in UAE | AED 245 | Travl',
    description:
      'Annual multi-trip travel insurance for UAE residents, issued by AXA. One policy covers all your trips for a year. From AED 245. Instant policy delivery.',
    canonical: 'https://www.travl.ae/travel-insurance/annual-multi-trip',
  },
  sections: {
    hero: {
      title: 'Annual Multi-Trip Travel Insurance for UAE Residents',
      subtitle:
        'Annual multi-trip travel insurance gives you a single policy that covers every trip you take within a 12-month period. Instead of buying a new policy each time you travel, you pay once and stay covered all year. Plans are issued by AXA and start from AED 245.',
      form: <AllForms defaultTab="insurance" />,
    },
    process: {
      title: 'How to Get Annual Travel Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our Annual Multi-Trip Plans',
      text: 'We provide annual multi-trip travel insurance for UAE residents who travel frequently. One policy from AXA covers all your international trips throughout the year, with no need to arrange new coverage before each departure. Each trip is covered from the moment you leave the UAE until you return, up to the maximum trip duration in your plan.',
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(pageData.meta),
    buildService({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      areaServed: 'AE',
    }),
    buildProduct({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      price: '245.00',
      currency: 'AED',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'Annual Multi-Trip Travel Insurance FAQ',
      description: pageData.meta.description,
      faqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <Hero
        title={pageData.sections.hero.title}
        subtitle={pageData.sections.hero.subtitle}
        form={pageData.sections.hero.form}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={pageData.sections.process.steps}
      />
      <About
        title={pageData.sections.about.title}
        text={pageData.sections.about.text}
      />
      <PrimarySection className="py-14 md:py-18 lg:py-24 bg-gray-50/70">
        <Container>
          <SectionTitle textAlign="center" className="mb-10 md:mb-12">
            Why UAE Residents Choose Our Annual Multi-Trip Plans
          </SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {reasons.map((reason, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-6 md:p-7 shadow-[0_12px_30px_rgba(16,24,40,0.07)]"
              >
                <h3 className="text-[20px] font-normal text-gray-900 font-outfit mb-2">
                  {reason.title}
                </h3>
                <p className="text-[16px] text-gray-600 font-light leading-6.5">
                  {reason.text}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </PrimarySection>
      <PrimarySection
        id="faq"
        className="py-14 md:py-18 lg:py-24 bg-gray-50/70"
      >
        <Container>
          <SectionTitle textAlign="center" className="mb-10 md:mb-12">
            Annual Multi-Trip Insurance — Frequently Asked Questions
          </SectionTitle>
          <div className="rounded-2xl border border-white bg-white p-4 md:p-7 shadow-[0_14px_35px_rgba(16,24,40,0.08)]">
            <div className="flex flex-col gap-1">
              {faqs.map((faq, i) => (
                <FAQAccordion key={i} question={faq.question}>
                  {faq.answer}
                </FAQAccordion>
              ))}
            </div>
          </div>
        </Container>
      </PrimarySection>
      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <SectionTitle textAlign="center" className="mb-6">
            Other Travel Insurance Plans
          </SectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'Schengen Visa Insurance', href: '/travel-insurance/schengen-visa' },
              { name: 'Travel Medical Insurance', href: '/travel-insurance/medical' },
              { name: 'International Travel Insurance', href: '/travel-insurance/international' },
              { name: 'Single Trip Insurance', href: '/travel-insurance/single-trip' },
              { name: 'All Travel Insurance Plans', href: '/travel-insurance' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 text-[14px] font-medium hover:bg-primary-100 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
