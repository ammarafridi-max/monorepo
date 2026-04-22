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
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

export const processSteps = [
  {
    title: 'Enter Your Trip Details',
    text: 'Select your departure and return dates, destination region, and number of travelers. Your single trip policy will be valid for exactly the dates you enter.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued correctly.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Complete your payment securely online and receive your single trip travel insurance policy by email within minutes. It is ready to download immediately for visa submission or travel.',
  },
];

const reasons = [
  {
    title: 'Coverage for One Journey',
    text: 'A single trip policy covers you from the day you leave the UAE to the day you return. There is no annual commitment and no unused coverage after your trip ends.',
  },
  {
    title: 'Pay Only for Your Trip Dates',
    text: 'You choose the exact start and end dates, so you only pay for the days you need. Shorter trips cost less than longer ones.',
  },
  {
    title: 'One-Time Travel Insurance for Visa Applications',
    text: 'Single trip policies are accepted for visa applications including Schengen, UK, Canada, and other destinations that require proof of travel insurance.',
  },
  {
    title: 'Schengen-Compliant Cover',
    text: 'Our single trip plans include the medical coverage required for Schengen visa applications and are accepted by European embassies, VFS, and BLS centers across the UAE.',
  },
  {
    title: 'Issued by AXA',
    text: 'Every policy is underwritten and issued by AXA. Your certificate is genuine and valid for embassy submissions and actual medical emergencies during your trip.',
  },
  {
    title: 'Instant Policy Delivery',
    text: 'Pay online and receive your single trip insurance certificate by email straight away. No waiting period and no office visit required.',
  },
];

export const faqs = [
  {
    question: 'What is single trip travel insurance?',
    answer:
      'Single trip travel insurance covers one specific journey between a set departure date and return date. It is designed for travelers who do not travel frequently enough to need an annual plan.',
  },
  {
    question: 'Is single trip insurance accepted for a Schengen visa?',
    answer:
      'Yes. Our single trip plans are Schengen-compliant and accepted by European embassies, VFS Global, and BLS International centers in the UAE.',
  },
  {
    question: 'What does short trip insurance include?',
    answer:
      'Coverage typically includes emergency medical treatment, hospitalisation, trip cancellations, baggage loss, travel delays, and medical repatriation. The exact scope depends on the plan you choose.',
  },
  {
    question: 'When should I choose single trip over annual travel insurance?',
    answer:
      'If you travel once or twice a year, a single trip policy is usually the more cost-effective choice. If you travel three or more times a year, an annual multi-trip plan often works out cheaper overall.',
  },
  {
    question: 'How quickly will I receive my single trip policy?',
    answer:
      'Your single trip insurance policy is issued instantly and delivered to your email within minutes of successful payment. No office visit is required.',
  },
];

export const pageData = {
  meta: {
    title: 'Single Trip Travel Insurance for UAE Residents | Travl',
    description:
      'Buy single trip travel insurance online in UAE. One-time coverage for your journey, Schengen compliant, issued by AXA. Get your policy instantly at Travl.',
    canonical: 'https://www.travl.ae/travel-insurance/single-trip',
  },
  sections: {
    hero: {
      title: 'Single Trip Travel Insurance for UAE Residents',
      subtitle:
        'Single trip travel insurance covers one specific journey, from your departure date to your return. It is the simplest way to get the coverage you need, whether you are applying for a visa or just want protection during your trip. Policies are issued by AXA and delivered instantly after payment.',
      form: <AllForms defaultTab="insurance" />,
    },
    process: {
      title: 'How to Get Single Trip Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our Single Trip Insurance',
      text: 'We provide single trip travel insurance for UAE residents through AXA. Each policy covers one journey between your chosen travel dates, with no commitment beyond that trip. Whether you need coverage for a visa application or want to travel with proper protection in place, you can get your policy entirely online and receive it within minutes of payment.',
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
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'Single Trip Travel Insurance FAQ',
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
            Why UAE Residents Choose Our Single Trip Insurance
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
            Single Trip Insurance — Frequently Asked Questions
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
              { name: 'International Travel Insurance', href: '/travel-insurance/international' },
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
