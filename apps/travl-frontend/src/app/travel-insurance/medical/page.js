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
    text: 'Select your travel dates, destination region, and number of travelers. The form adjusts based on your destination and coverage requirements.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued correctly.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Complete your payment securely online and receive your travel medical insurance policy by email within minutes. It is ready to download for visa submission or travel.',
  },
];

const reasons = [
  {
    title: 'Emergency Medical Cover While Travelling',
    text: 'Our policies cover emergency medical treatment if you fall ill or get injured abroad, including doctor visits, hospital stays, and specialist care.',
  },
  {
    title: 'Hospitalisation and Medical Repatriation',
    text: 'If you need to be admitted to hospital or brought home for treatment, your policy covers the costs of inpatient care and medical repatriation to the UAE.',
  },
  {
    title: 'Trip Medical Insurance for Visa Applications',
    text: 'Our travel medical insurance meets the documentation requirements for visa applications to Schengen countries, the UK, Canada, and other destinations that require proof of coverage.',
  },
  {
    title: 'COVID-19 Medical Coverage',
    text: 'Most plans include medical coverage for COVID-19 related illness during your trip. Coverage is subject to the terms and conditions of the policy you select.',
  },
  {
    title: 'Issued by AXA',
    text: 'Every policy is underwritten and issued by AXA, a licensed and globally recognised insurer. Your certificate is valid for embassy submissions and genuine medical claims.',
  },
  {
    title: 'Single-Trip and Annual Plans Available',
    text: 'Choose a single-trip policy for one journey or an annual multi-trip plan if you travel several times a year. Both options provide the same medical coverage.',
  },
];

export const faqs = [
  {
    question: 'What is travel medical insurance?',
    answer:
      'Travel medical insurance covers the cost of emergency medical treatment if you fall ill or get injured during a trip. It typically includes doctor visits, hospitalisation, surgical procedures, and repatriation back to your home country.',
  },
  {
    question: 'Is travel medical insurance required for a visa application?',
    answer:
      'Many countries require proof of medical coverage as part of their visa application process. Schengen countries require a minimum level of medical coverage. Our policies meet those requirements and are accepted by embassies, VFS, and BLS.',
  },
  {
    question: 'What does trip medical insurance cover?',
    answer:
      'Coverage includes emergency medical treatment, hospitalisation, surgical procedures, ambulance services, and medical repatriation. COVID-19 medical coverage is included in most plans, subject to policy terms.',
  },
  {
    question: 'Is this a genuine insurance policy or a dummy document?',
    answer:
      'This is a fully genuine, underwritten travel medical insurance policy issued by AXA. It is not a dummy document or a placeholder.',
  },
  {
    question: 'How quickly will I receive my policy?',
    answer:
      'Your policy is issued instantly and delivered to your email within minutes of successful payment. No office visit is required.',
  },
  {
    question: 'Can UAE residents buy travel medical insurance online?',
    answer:
      'Yes. UAE residents and citizens can purchase and receive a fully valid travel medical insurance policy entirely online, without visiting any office or insurance branch.',
  },
];

export const pageData = {
  meta: {
    title: 'Travel Medical Insurance for UAE Residents | Travl',
    description:
      'Travel medical insurance for UAE residents, issued by AXA. Emergency medical cover, hospitalisation, and repatriation. Get your policy online instantly.',
    canonical: 'https://www.travl.ae/travel-insurance/medical',
  },
  sections: {
    hero: {
      title: 'Travel Medical Insurance for UAE Residents',
      subtitle:
        'Travel medical insurance covers emergency treatment, hospital stays, and medical repatriation when you get sick or injured abroad. Policies are issued by AXA and delivered to your inbox in minutes.',
      form: <AllForms defaultTab="insurance" />,
    },
    process: {
      title: 'How to Get Travel Medical Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our Travel Medical Insurance',
      text: 'We provide travel medical insurance for UAE residents and citizens through AXA, one of the most recognised insurers in the world. Every plan is a genuine, fully underwritten policy. Whether you need cover for a visa application or want real protection during your trip, your policy is issued online and delivered instantly after payment.',
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
      title: 'Travel Medical Insurance FAQ',
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
            Why UAE Residents Choose Our Travel Medical Insurance
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
            Travel Medical Insurance — Frequently Asked Questions
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
              { name: 'Annual Multi-Trip Insurance', href: '/travel-insurance/annual-multi-trip' },
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
