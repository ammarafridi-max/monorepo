import Link from 'next/link';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';
import { buildMetadata } from '@/lib/schema';
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
    title: 'Tell us where and when',
    text: 'Travel dates, destination region, and how many of you there are by age group. The form grows or shrinks to match, whether that is one traveller or a family of six.',
  },
  {
    title: 'Fill in Passenger Details',
    text: 'Name, date of birth, nationality and passport number, copied exactly as they appear in the passport. A single transposed digit is the usual reason a visa centre sends a policy back, so it is worth the extra minute.',
  },
  {
    title: 'Pay and it is issued',
    text: 'Check the plan, pay, and the certificate arrives by email within minutes, ready to attach to a visa file or keep on your phone for the trip.',
  },
];

const reasons = [
  {
    title: 'A real policy, not a placeholder',
    text: 'This one is worth being clear about. Unlike a flight reservation, insurance is a live contract with a licensed insurer that pays out if something happens. You are buying cover, not a document.',
  },
  {
    title: 'Clears the Schengen threshold',
    text: 'Every plan carries at least EUR 30,000 of medical cover, valid across all member states, which is the number consulates check for.',
  },
  {
    title: 'Issued the moment you pay',
    text: 'The certificate is generated and emailed within minutes. No branch visit, no callback, no waiting for underwriting.',
  },
  {
    title: 'Covers more than the visa needs',
    text: 'Emergency treatment and hospital stays, cancellation, delays, lost baggage, and COVID-19 handled as any other illness. Limits are in the policy wording and worth two minutes of your time.',
  },
  {
    title: 'Priced for the trip you are taking',
    text: 'Rates track your destination, dates and ages rather than a flat headline number, so a short European hop does not cost what a month in the US does.',
  },
  {
    title: 'Single trip or the whole year',
    text: 'One trip, or an annual multi-trip policy if you are in and out of the country often. If you travel more than twice a year, do the sum before you pick.',
  },
];

export const faqs = [
  {
    question:
      'Is travel insurance mandatory for UAE residents traveling abroad?',
    answer:
      'It depends on the destination. Schengen states treat it as a hard requirement and will refuse a file without it. Plenty of other countries leave it to you, which is a different question from whether it is a good idea.',
  },
  {
    question: 'Does your travel insurance meet Schengen visa requirements?',
    answer:
      'Yes. Every plan clears the EUR 30,000 medical minimum and is valid across the member states, which is what consulates, VFS and BLS check for.',
  },
  {
    question: 'Is this a real insurance policy or a dummy document?',
    answer:
      'Real, underwritten, and issued by a licensed insurer. Worth separating from the flight reservation in your head: the reservation is evidence of a plan, this is cover that pays a hospital.',
  },
  {
    question: 'How quickly will I receive my policy after payment?',
    answer:
      'Minutes. The policy is issued the moment payment clears and the certificate emails itself to you.',
  },
  {
    question: 'Can I buy travel insurance online as a UAE resident?',
    answer:
      'Yes, start to finish, with no branch visit and nothing to sign in person.',
  },
  {
    question: 'What does the travel insurance policy cover?',
    answer:
      'Emergency medical costs and hospital stays, cancellation, delayed or lost baggage, travel delays, and COVID-19 treated as any other illness abroad. Each has its own limit, set out in the policy wording.',
  },
];

export const pageData = {
  meta: {
    title: 'Travel Insurance for UAE Residents | Instant Policy Delivery',
    description:
      'Genuine AXA travel insurance for UAE residents, meeting the EUR 30,000 Schengen minimum. Bought online, issued in minutes, valid the moment you pay.',
    canonical: 'https://www.thedummyticket.ae/travel-insurance',
    entityName: 'Travel Insurance',
  },
  sections: {
    hero: {
      title: 'Real cover, issued in minutes, accepted by consulates.',
      subtitle:
        'This is a genuine AXA policy that pays out, not a document you wave at a visa officer. Emergency medical, hospitalisation, repatriation, cancellation and baggage, at the EUR 30,000 minimum Schengen insists on. Buy it online and the certificate is in your inbox before you have closed the tab.',
      form: <AllForms defaultTab="insurance" />,
    },
    process: {
      title: 'How Do You Buy Travel Insurance?',
      subtitle: 'Three steps, and you are covered by the end of them',
      steps: processSteps,
    },
    about: {
      title: 'About Our Travel Insurance',
      text: (
        <>
          We cover residents and citizens across Dubai, Abu Dhabi and the rest of the UAE, with the policy issued on the spot. Article 15 of the{' '}<a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32009R0810" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-900">EU Visa Code</a>{' '}fixes the EUR 30,000 medical minimum for a Schengen application, and every plan here clears it without you having to check the small print.
        </>
      ),
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Genuine AXA cover for UAE residents. Meets embassy requirements, pays for medical emergencies and cancellations, and is issued the moment you pay.',
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Dummy Tickets',
          description:
            'A held seat under a live PNR. Consulates usually want this in the same file as the insurance, so most people order both together.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'The third document in most visa files. Email us your cities and dates and we prepare it to match the rest of your application.',
        },
      ],
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
      name: pageData.meta.entityName,
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
        pills={[
          'Real Policy, Not a Placeholder',
          'Issued by AXA',
          'EUR 30,000 Medical Cover',
          'Instant Policy Delivery',
        ]}
        breadcrumbPaths={[
          { label: 'Home', href: '/' },
          { label: 'Travel Insurance' },
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={pageData.sections.process.steps}
      />
      <About
        title={pageData.sections.about.title}
        text={pageData.sections.about.text}
        services={pageData.sections.about.services}
      />
      <PrimarySection className="py-section bg-gray-50/70">
        <Container>
          <SectionTitle
            align="center"
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
      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <SectionTitle className="mb-4">
            Applying for a Schengen Visa?
          </SectionTitle>
          <p className="max-w-[820px] text-[16px] font-light leading-7 text-gray-700">
            Schengen applications have their own rules: EUR 30,000 medical
            cover, valid across all 27 countries, for the full length of your
            trip. Our{' '}
            <Link
              href="/schengen-travel-insurance"
              className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
            >
              Schengen travel insurance
            </Link>{' '}
            meets those requirements and starts at AED 30.
          </p>
        </Container>
      </PrimarySection>
      <PrimarySection className="py-section">
        <Container className="rounded-3xl border border-primary-100 bg-[linear-gradient(145deg,#f5fbfb_0%,#eff7ff_55%,#fff7f0_100%)] p-8 md:p-10">
          <SectionTitle className="mb-4">
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
        className="py-section bg-gray-50/70"
      >
        <Container>
          <SectionTitle
            align="center"
            subtitle="Common questions answered"
            className="mb-10 md:mb-12"
          >
            Travel Insurance: Frequently Asked Questions
          </SectionTitle>
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden [&>*:last-child]:border-b-0">
            {faqs.map((faq, i) => (
              <FaqAccordion key={i} question={faq.question}>
                {faq.answer}
              </FaqAccordion>
            ))}
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
