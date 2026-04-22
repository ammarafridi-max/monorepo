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
    text: 'Select your trip start and end dates, choose your destination region, and enter the number of travelers by age group. Whether you are traveling solo or with family, the form adjusts to your exact needs.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued correctly and accepted without issues at any embassy or visa center.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Review your selected plan, complete your payment securely online, and receive your travel insurance policy by email within minutes. It is ready to download immediately for visa submission or travel.',
  },
];

const reasons = [
  {
    title: 'Genuine Policy, Not a Reservation',
    text: 'Our travel insurance is a fully valid, legally issued policy backed by a licensed insurer. It is not a placeholder or a reservation.',
  },
  {
    title: 'Embassy-Compliant Coverage',
    text: 'Our plans meet official visa requirements, including the minimum EUR 30,000 medical coverage required for Schengen visa applications.',
  },
  {
    title: 'Instant Policy Delivery',
    text: 'Once your payment is confirmed, your policy is issued and delivered to your inbox within minutes. No office visit and no waiting.',
  },
  {
    title: 'Covers the Full Trip',
    text: 'Coverage includes emergency medical expenses, hospitalization, trip cancellations, baggage loss, travel delays, and COVID-19 medical coverage (as per policy terms).',
  },
  {
    title: 'Affordable Rates for Every Trip',
    text: 'We offer competitive pricing for single-trip and annual plans, giving UAE residents strong coverage with practical pricing.',
  },
  {
    title: 'Single and Annual Plans Available',
    text: 'Choose a single-trip plan for one-off travel or an annual multi-trip plan if you travel frequently.',
  },
];

export const faqs = [
  {
    question:
      'Is travel insurance mandatory for UAE residents traveling abroad?',
    answer:
      'Yes, many countries require valid travel insurance as part of the visa application process. Schengen states in particular make it a strict requirement.',
  },
  {
    question: 'Does your travel insurance meet Schengen visa requirements?',
    answer:
      'Yes. Our plans include the minimum EUR 30,000 medical coverage required by Schengen consulates and are suitable for embassy, VFS, and BLS submissions.',
  },
  {
    question: 'Is this a real insurance policy or a dummy document?',
    answer:
      'This is a fully genuine, underwritten insurance policy issued by a licensed insurer. It is not a dummy document.',
  },
  {
    question: 'How quickly will I receive my policy after payment?',
    answer:
      'Your policy is issued instantly and delivered to your email within minutes of successful payment.',
  },
  {
    question: 'Can I buy travel insurance online as a UAE resident?',
    answer:
      'Yes. UAE residents and citizens can purchase and receive a fully valid travel insurance policy entirely online.',
  },
  {
    question: 'What does the travel insurance policy cover?',
    answer:
      'Coverage includes emergency medical expenses, hospital stays, trip cancellations, baggage loss, travel delays, and COVID-19 related medical treatment during your trip.',
  },
];

export const pageData = {
  meta: {
    title: 'Travel Insurance for UAE Residents | Instant Policy Delivery',
    description:
      'Get real, embassy-compliant travel insurance online with instant policy delivery for UAE residents and citizens.',
    canonical: 'https://www.travl.ae/travel-insurance',
  },
  sections: {
    hero: {
      title: 'Travel Insurance for UAE Residents',
      subtitle:
        'Get real, embassy-compliant travel insurance online with instant policy delivery. Our plans are genuine, legally valid, and accepted for Schengen visa applications and international travel from the UAE.',
      form: <AllForms defaultTab="insurance" />,
    },
    process: {
      title: 'How to Book Travel Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our Travel Insurance',
      text: 'We provide travel insurance for UAE residents and citizens with instant policy delivery, genuine coverage, and pricing that makes sense. Every plan we issue meets embassy requirements and gives you real protection throughout your trip.',
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
      title: 'Travel Insurance FAQ',
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
          <SectionTitle
            textAlign="center"
            subtitle="Trusted travel insurance provider for UAE residents"
            className="mb-10 md:mb-12"
          >
            Why Book Travel Insurance With Us?
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
      <PrimarySection className="py-14 md:py-18 lg:py-24">
        <Container className="rounded-3xl border border-primary-100 bg-[linear-gradient(145deg,#f5fbfb_0%,#eff7ff_55%,#fff7f0_100%)] p-8 md:p-10">
          <SectionTitle textAlign="center" className="mb-4">
            Ready to Get Insured Before Your Trip?
          </SectionTitle>
          <p className="text-[16px] md:text-[18px] text-gray-700 font-light leading-7 max-w-[820px]">
            Do not leave your travel plans or your visa application without
            proper coverage. Get your genuine, embassy-accepted travel insurance
            policy in minutes and travel from the UAE with confidence.
          </p>
        </Container>
      </PrimarySection>
      <PrimarySection
        id="faq"
        className="py-14 md:py-18 lg:py-24 bg-gray-50/70"
      >
        <Container>
          <SectionTitle
            textAlign="center"
            subtitle="Frequently Asked Questions"
            className="mb-10 md:mb-12"
          >
            Common questions answered
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
    </>
  );
}
