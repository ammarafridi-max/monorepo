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
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

export const processSteps = [
  {
    title: 'Enter Your Trip Details',
    text: 'Travel dates, where in Europe you are heading, and how many of you there are. The form defaults to the cover Schengen requires, so you cannot accidentally buy something too thin.',
  },
  {
    title: 'Fill in Passenger Details',
    text: 'Copy each traveller straight from the passport, spelling and all. Mismatched details are the usual reason a consulate hands a policy back, and reissuing costs you a day.',
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Pay and the certificate is issued straight away, in your inbox within minutes and ready to upload with the rest of your file.',
  },
];

const reasons = [
  {
    title: 'Meets the rule exactly',
    text: 'EUR 30,000 of medical cover, valid in all 27 Schengen countries, including repatriation. That is the wording consulates check against.',
  },
  {
    title: 'It actually pays out',
    text: 'A licensed insurer stands behind this, so it works for the visa file and again if you end up in a hospital in Lisbon. Those are not always the same product elsewhere.',
  },
  {
    title: 'Same day submission',
    text: 'The certificate arrives right after payment, so a policy bought this morning goes in with an application filed this afternoon.',
  },
  {
    title: 'Cover beyond the minimum',
    text: 'Emergency treatment, hospital stays and repatriation, plus delays, lost baggage and cancellation. The visa only cares about the first part, but the rest is what you use.',
  },
  {
    title: 'From AED 30',
    text: 'Compare plans side by side and take the one that clears the requirement. There is no reason to pay for extras a consulate never asked about.',
  },
  {
    title: 'Single-Trip and Multi-Trip Plans',
    text: 'One application, or a year of them. If Europe is a regular trip for you, price the annual policy before you buy the single.',
  },
];

export const faqs = [
  {
    question: 'Is travel insurance mandatory for a Schengen visa?',
    answer:
      'Yes, and there is no way around it. The policy has to carry at least EUR 30,000 of medical cover, work in every Schengen country, and run for the whole time you are there. Miss any of the three and the file comes back.',
  },
  {
    question: 'What coverage is required for Schengen travel insurance?',
    answer:
      'EUR 30,000 minimum for medical costs, and it has to stretch to emergency treatment, a hospital stay, and repatriation home. Repatriation is the part cheap policies quietly leave out, so check for it.',
  },
  {
    question: 'Is this policy valid across all Schengen countries?',
    answer:
      'Yes, all 27 of them. Useful if your trip crosses borders, since a policy limited to one country will not satisfy the consulate even when you only plan to visit one.',
  },
  {
    question: 'How much does Schengen travel insurance cost for UAE residents?',
    answer:
      'From AED 30, with the final price driven by your dates, destination and how many travellers are on the policy. The form on this page will price it in a few seconds.',
  },
  {
    question: 'How quickly will I receive my travel insurance policy?',
    answer:
      'Within minutes of payment clearing. It is generated automatically, so time of day makes no difference.',
  },
  {
    question: 'Is this insurance accepted by VFS and BLS?',
    answer:
      'Yes. These policies go through VFS Global and BLS International centres in the UAE every day without being questioned.',
  },
  {
    question: "Do I need travel insurance if I'm only applying for a visa?",
    answer:
      'Yes. The insurance has to be in the file when you submit, before any flights are booked and before you know the answer. Use your intended dates, the same ones on your reservation, and buy cover for those.',
  },
];

export const pageData = {
  meta: {
    title:
      'Schengen Travel Insurance UAE From AED 30 | Instant Policy',
    description:
      'Genuine AXA cover with the EUR 30,000 medical minimum, valid across all 27 Schengen states. Issued in minutes for UAE residents, from AED 30.',
    canonical: 'https://www.thedummyticket.ae/schengen-travel-insurance',
    entityName: 'Schengen Travel Insurance',
  },
  sections: {
    hero: {
      title: 'Schengen cover that clears EUR 30,000. From AED 30.',
      subtitle:
        'Article 15 of the EU Visa Code sets the number and every policy here meets it, valid in all 27 member states. Genuine AXA cover, so it works for the application and again if you need a doctor in Rome. Handed in daily at VFS and BLS across the UAE, and issued within minutes of payment.',
      form: <AllForms defaultTab="insurance" />,
    },
    process: {
      title: 'How Do You Buy Schengen Travel Insurance?',
      subtitle: 'Three steps, and the certificate is in your inbox',
      steps: processSteps,
    },
    about: {
      title: 'About Our Services',
      text: (
        <>
          Schengen cover for UAE residents applying for a European visa, priced and issued here in the UAE. The EUR 30,000 medical minimum is not our rule, it comes from Article 15 of the{' '}<a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32009R0810" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-900">EU Visa Code</a>, and every policy here meets it. Valid across all 27 member states, and handled without fuss at VFS Global and BLS International.
        </>
      ),
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Schengen Travel Insurance',
          description:
            'AXA cover at the mandatory EUR 30,000, issued the moment you pay and accepted at VFS Global and BLS International.',
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Dummy Tickets for Schengen Visa',
          description:
            'The other half of a Schengen file: a held seat under a live PNR, showing how you intend to travel. From AED 49.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Consulates ask where you are staying as well. Send us your cities and dates and we prepare the reservation to match your itinerary.',
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
    buildProduct({
      canonical: pageData.meta.canonical,
      name: pageData.meta.entityName,
      description: pageData.meta.description,
      price: '30.00',
      currency: 'AED',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'Schengen Travel Insurance FAQ',
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
          'EUR 30,000 Medical Cover',
          'Real Policy, Not a Placeholder',
          'Issued by AXA',
          'Accepted by VFS & BLS',
          'Instant Policy Delivery',
        ]}
        breadcrumbPaths={[
          { label: 'Home', href: '/' },
          { label: 'Schengen Travel Insurance' },
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
          <SectionTitle align="center" className="mb-10 md:mb-12">
            Why UAE Residents Choose Us for Schengen Travel Insurance
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
      <PrimarySection className="py-section">
        <Container className="rounded-3xl border border-primary-100 bg-[linear-gradient(145deg,#f5fbfb_0%,#eff7ff_55%,#fff7f0_100%)] p-8 md:p-10">
          <SectionTitle className="mb-4">
            Get Your Schengen Travel Insurance Policy Now
          </SectionTitle>
          <p className="text-[16px] md:text-[18px] text-gray-700 font-light leading-7 max-w-[820px]">
            Don&apos;t submit your Schengen visa application without the right
            coverage. Get an embassy-compliant travel insurance certificate in
            minutes, accepted by VFS and BLS, valid for all Schengen countries.
          </p>
          <Link
            href="#form"
            className="inline-block mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white text-[15px] font-medium hover:bg-primary-700 transition-colors"
          >
            Buy Travel Insurance From AED 30
          </Link>
        </Container>
      </PrimarySection>
      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <SectionTitle className="mb-4">
            Travelling Outside the Schengen Area?
          </SectionTitle>
          <p className="max-w-[820px] text-[16px] font-light leading-7 text-gray-700">
            Schengen cover is built for European visa applications. For trips
            anywhere else, our{' '}
            <Link
              href="/travel-insurance"
              className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
            >
              travel insurance for UAE residents
            </Link>{' '}
            covers single trips and annual multi-trip plans, issued by AXA and
            delivered instantly.
          </p>
        </Container>
      </PrimarySection>
      <PrimarySection
        id="faq"
        className="py-section bg-gray-50/70"
      >
        <Container>
          <SectionTitle align="center" className="mb-10 md:mb-12">
            Schengen Travel Insurance: Frequently Asked Questions
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
