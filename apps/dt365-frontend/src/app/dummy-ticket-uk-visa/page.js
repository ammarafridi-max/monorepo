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
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
// import QuickAnswer from '@/components/QuickAnswer';
import RelatedPages from '@/components/RelatedPages';

const benefits = [
  {
    title: 'Authentic Reservation Structure',
    text: 'Each flight reservation includes a real, checkable booking reference (PNR) generated through recognized reservation systems. During validity, embassies or visa centers can perform routine checks using this PNR.',
    icon: HiOutlineCheckBadge,
  },
  {
    title: 'Cost-Effective Starting at Just $13',
    text: 'Our dummy tickets start from $13, allowing applicants to meet UK visa requirements without purchasing a full-priced, non-refundable airline ticket.',
    icon: HiOutlineBanknotes,
  },
  {
    title: 'Wide Acceptance',
    text: 'Our flight reservation format is suitable for UK visa applications submitted worldwide and is commonly used for visitor, business, and study visas.',
    icon: HiOutlineGlobeAlt,
  },
  {
    title: 'Flexible Support',
    text: 'Visa processing times vary and travel plans change. Our service lets you submit a compliant itinerary now and finalize your actual booking later.',
    icon: HiOutlineArrowsRightLeft,
  },
  {
    title: 'Timely Delivery',
    text: 'After payment, your UK visa flight itinerary is delivered by email within minutes, ready for download or submission.',
    icon: HiOutlineClock,
  },
  {
    title: 'Selectable Validity',
    text: 'Choose a validity period such as 48 hours, 7 days, or 14 days to match your visa appointment or review timeline.',
    icon: HiOutlineCalendarDays,
  },
];

const faqs = [
  {
    question: 'Is a dummy ticket acceptable for UK visa applications?',
    answer:
      'UK visa applications generally require proof of travel plans rather than a paid ticket. Dummy flight reservations are commonly used for this purpose. Final acceptance depends on UK Visas and Immigration (UKVI).',
  },
  {
    question: 'Does the flight reservation include a verifiable PNR?',
    answer:
      'Yes. Each UK visa flight reservation includes a booking reference (PNR) that can be checked online during the selected validity period.',
  },
  {
    question: 'How long is the dummy ticket valid?',
    answer:
      'You can choose a validity of 48 hours, 7 days, or 14 days at the time of booking to match your visa submission timeline.',
  },
  {
    question: 'How much does a dummy ticket for a UK visa cost?',
    answer:
      'Pricing starts from $13 and may vary based on the selected validity and itinerary type.',
  },
  {
    question: 'Can I use this dummy ticket to board a flight?',
    answer:
      'No. Dummy tickets are for visa application purposes only. You must purchase a real airline ticket after your UK visa is approved.',
  },
];

const pageData = {
  meta: {
    title: 'Dummy Ticket for UK Visa From $13 | Verifiable PNR',
    description:
      'Secure a dummy ticket for UK visa applications with a verifiable PNR. Accepted for visa submissions and available from $13.',
    canonical: 'https://www.dummyticket365.com/dummy-ticket-uk-visa',
  },
  sections: {
    hero: {
      title: 'Book Your Dummy Ticket for UK Visa from $13',
      subtitle:
        'Secure a dummy ticket for UK visa applications with a verifiable PNR, without purchasing a fully paid airline ticket. Commonly used to show travel intent for UK visa submissions.',
      form: <AllForms forms={['ticket']} />,
    },
    process: {
      title: 'How to Book Your Dummy Flight Ticket for a UK Visa',
      subtitle: 'Follow these three simple steps to get your visa flight reservation:',
    },
    about: {
      title: 'About Us',
      text: 'DummyTicket365 is an international travel documentation service supporting visa applicants worldwide. We provide visa-compliant travel documents that meet immigration expectations without requiring irreversible travel purchases. Our services are used for UK, Schengen, US, Canadian, and other visa applications.',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Ticket for UK Visa",
          description: "Verifiable flight reservation with a real PNR, formatted to meet UK visa requirements. Accepted by UKVI and visa centres. Instant delivery from USD 13.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description: "Temporary hotel reservations formatted to UK visa standards. Like dummy tickets, these are real reservations — not paid bookings — so your UKVI file is complete without locking in non-refundable nights before approval.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Insurance",
          description: "Genuine AXA-backed travel insurance for visa applicants and travellers. Schengen-compliant plans available if your itinerary includes European destinations.",
        },
      ],
    },
    benefits: {
      title: 'Benefits of Our Dummy Ticket for UK Visa',
      subtitle: 'Applicants choose our UK visa dummy tickets for the following reasons:',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about dummy tickets for UK visas',
      faqs,
    },
    contact: {
      title: 'Questions About UK Visa Dummy Tickets?',
      text: 'With DummyTicket365, you can secure a flight reservation for a UK visa that meets application requirements. Our service is available 24/7, and our support team can assist with updates or document adjustments.',
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Dummy Ticket for UK Visa' },
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
          'Accepted for UK visa submissions',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />

      {/* <QuickAnswer
        question="Do you need a flight reservation for a UK visa?"
        answer="Not strictly. UKVI does not list a flight booking as a required document for the Standard Visitor visa. It is strongly recommended though, because a flight itinerary helps caseworkers see your intended dates and route. A dummy ticket with a verifiable PNR meets that bar without you paying for a non-refundable ticket months before approval."
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

      <FAQ
        title={pageData.sections.faqs.title}
        subtitle={pageData.sections.faqs.subtitle}
        faqs={pageData.sections.faqs.faqs}
      />

      <RelatedPages
        title="Related Dummy Ticket Pages"
        subtitle="Other visa applications we support"
        links={[
          { anchor: 'Dummy ticket for a Schengen visa', href: '/dummy-ticket-schengen-visa', blurb: 'EU Visa Code Article 14 compliant, accepted at VFS, BLS, and TLScontact.' },
          { anchor: 'Dummy ticket for a Canada visa', href: '/dummy-ticket-canada-visa', blurb: 'Aligned with IRCC guidance on flight bookings before approval.' },
          { anchor: 'Dummy ticket for an Australia visa', href: '/dummy-ticket-australia-visa', blurb: 'Formatted for the Subclass 600 ImmiAccount upload.' },
          { anchor: 'Dummy ticket for a Japan visa', href: '/dummy-ticket-japan-visa', blurb: 'Round-trip format for embassy and JAPAN eVISA portal submissions.' },
        ]}
      />

      <Contact
        title={pageData.sections.contact.title}
        text={pageData.sections.contact.text}
      />
    </>
  );
}
