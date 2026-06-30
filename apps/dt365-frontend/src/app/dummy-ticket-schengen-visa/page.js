import { buildMetadata } from '@/lib/schema';
import {
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import {
  HiOutlineCheckBadge,
  HiOutlineBanknotes,
  HiOutlineGlobeAlt,
  HiOutlineArrowsRightLeft,
  HiOutlineClock,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineHotel } from 'react-icons/md';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';
// import QuickAnswer from '@/components/QuickAnswer';
import RelatedPages from '@/components/RelatedPages';

const benefits = [
  {
    title: 'Aligned With EU Visa Code Article 14',
    text: 'Article 14 of the EU Visa Code lists a flight reservation among the supporting documents for a short-stay Schengen visa, not a paid ticket. Our dummy ticket gives you that document in the exact form consulates expect, without forcing you to buy airfare before approval.',
    icon: HiOutlineCheckBadge,
  },
  {
    title: 'Verifiable PNR on Global GDS Platforms',
    text: 'Every reservation carries a six-character PNR on Amadeus, Sabre, and Travelport. The same systems VFS, BLS, TLScontact, and consulate staff use to confirm bookings. Verification is direct, not via an airline website.',
    icon: HiOutlineGlobeAlt,
  },
  {
    title: 'Accepted at VFS, BLS, and TLScontact',
    text: 'Our format matches what Schengen visa centres in the UAE, India, the Philippines, Nigeria, and elsewhere expect to see on file. Used on French, German, Italian, Spanish, Dutch, Greek, and other Schengen applications.',
    icon: HiOutlineArrowsRightLeft,
  },
  {
    title: 'Three Validity Tiers From $13',
    text: 'Pick the tier that matches your appointment and review window: 2 days for $13, 7 days for $20, 14 days for $23. All tiers include the same verifiable PNR and the same accepted format. Reissue available if processing runs longer.',
    icon: HiOutlineBanknotes,
  },
  {
    title: 'Round-Trip Itineraries the Way Consulates Want Them',
    text: 'Schengen applications need a return leg covering the full intended stay. We issue round-trip reservations with real airline codes, valid IATA airports, and realistic fare classes. The dates match what you enter at the application stage.',
    icon: HiOutlineCalendarDays,
  },
  {
    title: 'Bundled With Hotel Reservations and Travel Insurance',
    text: 'Schengen files need three things: flight reservation, accommodation proof, and EUR 30,000 medical insurance. Order all three together and ship them to the appointment as one clean file.',
    icon: HiOutlineClock,
  },
];

const faqs = [
  {
    question: 'Is a dummy ticket accepted for a Schengen visa?',
    answer:
      'Yes. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a short-stay Schengen visa, not a paid ticket. Embassies, VFS, BLS, and TLScontact centres accept flight reservations with a verifiable PNR. Final acceptance depends on the specific consulate handling your file.',
  },
  {
    question: 'What flight reservation do the 2026 Schengen requirements ask for?',
    answer:
      'A round-trip flight reservation with verifiable PNR, real airline codes and flight numbers, valid IATA airport codes, and dates that cover your full intended stay. The reservation must be checkable during the appointment window. We issue exactly that, on Amadeus, Sabre, and Travelport.',
  },
  {
    question: 'Can I use a dummy ticket for the Schengen visa application?',
    answer:
      'Yes. The dummy ticket is built for the application stage. You submit it at the visa centre alongside your passport, photos, financials, insurance, and accommodation proof. Once the visa is granted you buy the real flight.',
  },
  {
    question: 'How do I book a dummy ticket for a Schengen visa?',
    answer:
      'Three steps. Enter your route, travel dates, and passenger details. Pick a validity tier (2 days for $13, 7 days for $20, 14 days for $23). Pay online. The PDF arrives by email within minutes with the PNR ready to submit.',
  },
  {
    question: 'Is the reservation verifiable?',
    answer:
      "Yes, on global GDS platforms. The PNR is live on Amadeus, Sabre, and Travelport during the validity window. Any IATA-accredited travel agent and most consulate staff use those systems daily. Verification is direct and does not depend on an airline's public website.",
  },
  {
    question: 'Do I also need proof of accommodation for a Schengen visa?',
    answer:
      'Yes. Consulates require hotel reservations or a host invitation for the full duration of the stay. We issue temporary hotel reservations in the same way as dummy tickets, real reservations not paid bookings, ready to submit alongside the flight reservation.',
  },
  {
    question: 'How long should the reservation stay valid for my appointment?',
    answer:
      'Long enough to cover the period from submission to decision. Schengen visas typically take 15 working days, sometimes 30 to 45 days in busy periods. Most applicants pick the 7-day or 14-day tier. If processing runs longer, we reissue with the same details and a fresh PNR.',
  },
  {
    question: 'What happens if my visa is approved with different dates?',
    answer:
      'Buy the real ticket for the dates you actually want to travel. The dummy ticket was for the application file, not the trip itself. Consulates expect the final purchased ticket to match approved visa dates, not the original reservation.',
  },
];

const pageData = {
  meta: {
    title: 'Dummy Ticket for Schengen Visa From $13 | Verifiable PNR',
    description:
      'Secure a dummy ticket for Schengen visa applications with a verifiable PNR, accepted for visa submissions. Budget-friendly pricing from $13.',
    canonical: 'https://www.dummyticket365.com/dummy-ticket-schengen-visa',
  },
  sections: {
    hero: {
      title: 'Book Your Dummy Ticket For Schengen Visa From $13',
      subtitle:
        'Secure a dummy ticket for Schengen visa applications with a verifiable PNR, without buying an expensive flight. Widely used for embassy, VFS, and BLS submissions, and trusted worldwide for clear, credible travel plans.',
      form: <AllForms forms={['ticket']} />,
    },
    process: {
      title: 'How to Book Your Dummy Flight Ticket for a Schengen Visa?',
      subtitle:
        'Here are three clear steps that can help you get a smooth visa flight reservation:',
    },
    about: {
      title: 'About DummyTicket365 Services',
      text: 'DummyTicket365 is an international travel documentation service supporting visa applicants worldwide. We provide visa-compliant travel documents that meet immigration requirements without forcing applicants to make irreversible travel purchases. Our services are used by travelers applying for Schengen, UK, US, Canadian, and other visas.',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Ticket for Schengen Visa",
          description: "Verifiable flight reservation with a real PNR, issued in the format required by Schengen embassies. Accepted by VFS Global and BLS International. From USD 13.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Schengen Travel Insurance",
          description: "Schengen visa applications require EUR 30,000 minimum medical coverage. We issue AXA-backed, embassy-compliant insurance instantly — bundle it with your dummy ticket.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description: "Temporary hotel reservations formatted to meet Schengen embassy and consulate requirements. Like dummy tickets, these are real reservations — not paid bookings — delivered by email so your visa file is complete without the upfront commitment.",
        },
      ],
    },
    benefits: {
      title: 'Benefits of Our Dummy Ticket for Schengen Visa',
      subtitle:
        'We are a top international dummy ticket provider for the Schengen visas, and people choose us for the following reasons:',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about dummy tickets for Schengen visas',
      faqs,
    },
    contact: {
      title: 'Questions on our dummy tickets?',
      text: 'With DummyTicket365, you can secure a flight reservation for a Schengen visa that meets application requirements. Our service is available 24/7, and you can contact our support team anytime via email for assistance or document updates.',
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Dummy Ticket for Schengen Visa' },
  ];

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
      price: '13.00',
      currency: 'USD',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: pageData.sections.faqs.title,
      description: pageData.meta.description,
      faqs: pageData.sections.faqs.faqs,
    }),
    buildBreadcrumbList({ paths: breadcrumbPaths }),
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
          'Dummy tickets from $13',
          'Verifiable PNR included',
          'Accepted by VFS and BLS',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />

      {/* <QuickAnswer
        question="Is a dummy ticket accepted for a Schengen visa?"
        answer="Yes. Schengen embassies and visa centres routinely accept a flight reservation in place of a paid ticket at the application stage. EU Visa Code Article 14 lists flight reservation among the supporting documents, not a purchased ticket. Our dummy ticket carries a verifiable PNR on Amadeus, Sabre, and Travelport, so consulates and VFS or BLS staff can confirm it directly."
      /> */}

      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
      />

      <About
        title={pageData.sections.about.title}
        text={pageData.sections.about.text}
        services={pageData.sections.about.services}
      />

      <Benefits
        title={pageData.sections.benefits.title}
        subtitle={pageData.sections.benefits.subtitle}
        benefits={pageData.sections.benefits.benefits}
      />

      {/* Inline FAQ render: this page ships 8 FAQs in the FAQPage schema,
          but the shared <FAQ> component caps the visible list to 6.
          Google's rich-result guidelines require schema content to be
          visible on-page, so we render the full set with the same
          primitives instead. */}
      <PrimarySection id="faq" className="py-14 md:py-18 lg:py-24 bg-gray-50/70">
        <Container>
          <SectionTitle
            textAlign="center"
            subtitle={pageData.sections.faqs.subtitle}
            className="mb-10 md:mb-12"
          >
            {pageData.sections.faqs.title}
          </SectionTitle>
          <div className="rounded-2xl border border-white bg-white p-4 md:p-7 shadow-[0_14px_35px_rgba(16,24,40,0.08)]">
            <div className="flex flex-col gap-1">
              {pageData.sections.faqs.faqs.map((faq, i) => (
                <FaqAccordion key={i} question={faq.question}>
                  {faq.answer}
                </FaqAccordion>
              ))}
            </div>
          </div>
        </Container>
      </PrimarySection>

      <RelatedPages
        title="Related Dummy Ticket Pages"
        subtitle="Other airlines and visa types for Schengen and beyond"
        links={[
          { anchor: 'Dummy ticket on Lufthansa (Schengen routes)', href: '/lufthansa-dummy-ticket', blurb: 'Frankfurt or Munich routing, the most common Schengen pairing.' },
          { anchor: 'Dummy ticket on Air France (Schengen routes)', href: '/air-france-dummy-ticket', blurb: 'CDG routing via SkyTeam, naturally suited to French consulate applications.' },
          { anchor: 'Dummy ticket on Turkish Airlines (Schengen routes)', href: '/turkish-airlines-dummy-ticket', blurb: 'Istanbul connection, competitive fares and wide Schengen network.' },
          { anchor: 'Dummy ticket for a UK visa', href: '/dummy-ticket-uk-visa', blurb: 'Standard Visitor visa file ready, no paid ticket needed before approval.' },
        ]}
      />

      <Contact
        title={pageData.sections.contact.title}
        text={pageData.sections.contact.text}
      />
    </>
  );
}
