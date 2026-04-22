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
    text: 'Select your travel dates, destination region, and number of travelers. International plans are available for most worldwide destinations.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued and accepted without issues.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Complete your payment securely online and receive your international travel insurance policy by email within minutes. It is ready to download for visa submission or travel.',
  },
];

const reasons = [
  {
    title: 'Worldwide Travel Insurance Coverage',
    text: 'Our international plans provide coverage across most destinations globally, so you are protected whether you are traveling to Europe, Asia, the Americas, or anywhere else.',
  },
  {
    title: 'Medical Coverage from EUR 80,000',
    text: 'International plans start with EUR 80,000 in emergency medical coverage, giving you solid protection for serious medical events while abroad.',
  },
  {
    title: 'International Health Insurance for Visa Applications',
    text: 'Our plans meet the insurance requirements for a wide range of visa applications, including Schengen and other destinations that require proof of medical coverage.',
  },
  {
    title: 'Emergency Medical Treatment and Repatriation',
    text: 'Coverage includes emergency hospital treatment, surgical procedures, ambulance services, and medical repatriation back to the UAE if required.',
  },
  {
    title: 'Issued by AXA',
    text: 'Every policy is underwritten and issued by AXA. Your international travel insurance certificate is genuine, legally valid, and accepted for embassy submissions and actual medical claims.',
  },
  {
    title: 'Single-Trip and Annual Plans',
    text: 'Choose a single-trip international policy for one journey, or an annual plan if you travel frequently to multiple destinations throughout the year.',
  },
];

export const faqs = [
  {
    question: 'What is international travel insurance?',
    answer:
      'International travel insurance covers you for medical emergencies and other unexpected events when travelling outside the UAE. It typically includes emergency medical treatment, hospitalisation, and repatriation back home.',
  },
  {
    question: 'What does international health insurance cover?',
    answer:
      'Coverage includes emergency medical treatment, hospitalisation, surgical procedures, ambulance services, medical repatriation, trip cancellations, baggage loss, and travel delays, depending on the plan you choose.',
  },
  {
    question: 'How much medical coverage does your international insurance include?',
    answer:
      'Our international travel insurance plans start with EUR 80,000 in emergency medical coverage. Higher limits may be available depending on the plan you select.',
  },
  {
    question: 'Is worldwide travel insurance accepted for visa applications?',
    answer:
      'Yes. Our international insurance plans meet the requirements for Schengen visa applications and other destinations that require proof of travel coverage.',
  },
  {
    question: 'How is international travel insurance different from standard travel insurance?',
    answer:
      'Standard travel insurance may limit coverage to specific regions. International and worldwide travel insurance covers most global destinations, making it suitable for travelers visiting multiple countries or less common destinations.',
  },
  {
    question: 'How quickly will I receive my international insurance policy?',
    answer:
      'Your policy is issued instantly and delivered to your email within minutes of successful payment. No office visit is required.',
  },
];

export const pageData = {
  meta: {
    title: 'International Travel Insurance for UAE Residents | Travl',
    description:
      'Worldwide travel insurance for UAE residents, issued by AXA. International health insurance from AED 70 with medical cover from EUR 80,000. Instant delivery.',
    canonical: 'https://www.travl.ae/travel-insurance/international',
  },
  sections: {
    hero: {
      title: 'International Travel Insurance for UAE Residents',
      subtitle:
        'International travel insurance covers you for medical emergencies, hospitalisation, and repatriation anywhere in the world. Plans are issued by AXA, start from AED 70, and include medical coverage from EUR 80,000. Get your policy online and receive it in minutes.',
      form: <AllForms defaultTab="insurance" />,
    },
    process: {
      title: 'How to Get International Travel Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our International Travel Insurance',
      text: 'We provide worldwide travel insurance for UAE residents through AXA. Our international health insurance plans cover emergency medical expenses, hospital treatment, and repatriation for trips across the globe. Plans start from AED 70 with medical coverage beginning at EUR 80,000, and your policy is delivered instantly after payment.',
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
      price: '70.00',
      currency: 'AED',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'International Travel Insurance FAQ',
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
            Why UAE Residents Choose Our International Travel Insurance
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
            International Travel Insurance — Frequently Asked Questions
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
              { name: 'Annual Multi-Trip Insurance', href: '/travel-insurance/annual-multi-trip' },
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
