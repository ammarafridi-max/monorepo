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
  HiOutlineGlobeAlt,
  HiOutlineArrowsRightLeft,
  HiOutlineMapPin,
  HiOutlineCurrencyDollar,
  HiOutlineUserGroup,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineHotel } from 'react-icons/md';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import QuickAnswer from '@/components/QuickAnswer';
import RelatedPages from '@/components/RelatedPages';

const processSteps = [
  {
    title: 'Tell us your route',
    text: 'Enter your departure city, destination, and travel dates. Turkish Airlines connects major cities across Asia, Africa, the Middle East, and the Americas through its hub at Istanbul Airport (IST). Whether it is a direct route or a connection via Istanbul, enter the full journey.',
  },
  {
    title: 'Choose your validity',
    text: 'Pick the validity period that matches your visa processing timeline. Schengen applications typically take 15 to 45 days; UK visas take 3 to 6 weeks. Choose 7-day or 14-day validity to keep the PNR active during review, with reissue options for longer processing windows.',
  },
  {
    title: 'Pay and receive instantly',
    text: 'Complete your secure payment and your Turkish Airlines flight reservation arrives in your inbox within minutes. The PDF includes your PNR, passenger name, TK flight numbers, IATA airport codes, and a round-trip itinerary ready for visa submission.',
  },
];

const benefits = [
  {
    title: 'Istanbul Is a Global Connecting Hub',
    text: 'Istanbul Airport serves as a bridge between Europe, Asia, Africa, and the Middle East. A single connection through IST can route you to virtually any major destination, which is why Turkish Airlines itineraries appear on visa applications for Schengen countries, the UK, the US, Canada, Japan, Australia, and many more.',
    icon: HiOutlineMapPin,
  },
  {
    title: 'Verifiable PNR on GDS Systems',
    text: 'Each reservation is created through recognized GDS platforms (Amadeus, Sabre, Travelport). During the validity period, visa officers and consulates can check the PNR on the same GDS systems they routinely use to confirm flight reservations.',
    icon: HiOutlineCheckBadge,
  },
  {
    title: 'Star Alliance Network Expands Your Routing',
    text: 'As a Star Alliance member, Turkish Airlines has codeshare and interline agreements with Lufthansa, SWISS, United, Air Canada, ANA, and Singapore Airlines. This allows multi-carrier itineraries under a single booking — particularly useful for complex visa applications involving connections on partner carriers.',
    icon: HiOutlineUserGroup,
  },
  {
    title: 'Competitive Fares Make the Itinerary Realistic',
    text: 'Visa officers assess whether a travel plan looks realistic, and pricing plays a role. Turkish Airlines is known for competitively priced fares on long-haul routes compared with European and North American carriers, so the itinerary reads as something a real traveler would book.',
    icon: HiOutlineCurrencyDollar,
  },
  {
    title: 'Wide Fare Family Options',
    text: 'Turkish Airlines offers multiple fare classes including EcoFly, ExtraFly, PrimeFly, and BusinessFly. Your reservation reflects a realistic fare class and booking code consistent with actual Turkish Airlines offerings, adding authenticity to how it appears in the GDS.',
    icon: HiOutlineArrowsRightLeft,
  },
  {
    title: 'Trusted by Millions of Travelers Annually',
    text: 'Turkish Airlines carried over 83 million passengers in 2024, making it one of the top five airlines globally by passenger volume. An itinerary on a well-known, reputable carrier is recognized instantly by visa officers and immigration authorities.',
    icon: HiOutlineGlobeAlt,
  },
];

const faqs = [
  {
    question: 'Can the Turkish Airlines dummy ticket PNR be verified?',
    answer:
      'Yes. Each reservation is issued through recognized GDS platforms (Amadeus, Sabre, Travelport) and includes a six-character PNR that visa officers, consulates, and travel agents can check on the same GDS systems during the selected validity period.',
  },
  {
    question: 'Is a Turkish Airlines dummy ticket accepted for Schengen visa applications?',
    answer:
      'Turkish Airlines itineraries are widely used and accepted for Schengen visa applications submitted at embassies and VFS centers worldwide. The EU Visa Code permits flight reservations rather than paid tickets at the application stage. Final acceptance depends on the consulate handling your application.',
  },
  {
    question: 'How long does the Turkish Airlines dummy ticket stay valid?',
    answer:
      'You can choose from 48-hour, 7-day, or 14-day validity at the time of booking. During this period, the PNR remains active and verifiable on GDS systems. If your visa processing takes longer than expected, we can reissue the reservation with the same travel details and a fresh PNR.',
  },
  {
    question: 'Does the dummy ticket show real Turkish Airlines flight numbers?',
    answer:
      'Yes. Each dummy ticket is based on actual Turkish Airlines flights with real TK flight numbers, accurate departure and arrival times, and correct IATA airport codes. The itinerary reflects a genuine route that Turkish Airlines operates, ensuring the reservation looks realistic and matches what a real traveler would book.',
  },
  {
    question: 'Can I get a multi-city dummy ticket on Turkish Airlines?',
    answer:
      'Yes. If your visa application involves visiting multiple cities, we can create a multi-city Turkish Airlines itinerary covering all segments. For example, Lagos to Istanbul to Paris to Rome to Istanbul to Lagos would be issued as a single multi-city reservation with a verifiable PNR covering all legs.',
  },
  {
    question: 'Can I use this dummy ticket to board a Turkish Airlines flight?',
    answer:
      'No. A dummy ticket is a temporary reservation for visa application purposes only. It does not include a paid e-ticket, so it cannot be used for check-in or boarding. Once your visa is approved, purchase your actual Turkish Airlines ticket directly on turkishairlines.com or through any travel agent.',
  },
];

const pageData = {
  meta: {
    title: 'Book a Dummy Ticket on Turkish Airlines from $13 | Verifiable PNR',
    description:
      'Get a verifiable Turkish Airlines flight reservation for your visa application from $13. PNR generated through recognized GDS systems and delivered to your inbox in minutes.',
    canonical: 'https://www.dummyticket365.com/turkish-airlines-dummy-ticket',
  },
  sections: {
    hero: {
      title: 'Book a Dummy Ticket on Turkish Airlines from $13',
      subtitle:
        'Get a verifiable Turkish Airlines flight reservation for your visa application without purchasing a non-refundable ticket. With over 340 destinations across 130 countries, Turkish Airlines is one of the most commonly used carriers on visa itineraries worldwide.',
      form: <AllForms forms={['ticket']} />,
    },
    process: {
      title: 'How to Book Your Turkish Airlines Dummy Ticket',
      subtitle:
        'Turkish Airlines itineraries appear frequently in Schengen, UK, US, and Middle Eastern visa applications due to the airline\'s extensive connectivity through Istanbul. Here is how to get yours:',
    },
    about: {
      title: 'About DummyTicket365 Services',
      text: 'DummyTicket365 is an international travel documentation service helping visa applicants worldwide with verifiable flight reservations. Our Turkish Airlines dummy tickets are used by travelers applying for Schengen, UK, US, Canadian, Australian, and other visas where proof of travel plans is required.',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Turkish Airlines Dummy Ticket',
          description:
            'A round-trip flight reservation on Turkish Airlines with a verifiable PNR. The reservation is created through recognized GDS platforms (Amadeus, Sabre, Travelport) so consulates and travel agents can confirm the booking during validity. Instant delivery from $13.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Genuine travel insurance for visa applicants. Schengen-compliant plans with the required EUR 30,000 minimum medical coverage are available if your Turkish Airlines itinerary includes European destinations. Bundle it with your dummy ticket for a complete visa document package.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Temporary hotel reservations formatted to embassy and consulate standards. Like dummy tickets, these are real reservations — not paid bookings — so your visa file is complete without locking in non-refundable nights before approval.',
        },
      ],
    },
    benefits: {
      title: 'Why Travelers Choose Turkish Airlines for Visa Itineraries',
      subtitle:
        'Turkish Airlines is one of the most popular choices on visa applications worldwide, and for good reason.',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about Turkish Airlines dummy tickets',
      faqs,
    },
    contact: {
      title: 'Questions on your Turkish Airlines dummy ticket?',
      text: 'Our team is available 24/7. If you need to confirm a routing through Istanbul, adjust dates, or extend a PNR during your visa processing window, email us and we will get back to you the same day.',
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Turkish Airlines Dummy Ticket' },
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
          'Verifiable PNR on GDS',
          '340+ destinations worldwide',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />

      <QuickAnswer
        question="Can you get a verifiable Turkish Airlines reservation without buying a ticket?"
        answer="Yes. We issue Turkish Airlines flight reservations through global GDS platforms (Amadeus, Sabre, Travelport) with a six-character PNR your consulate or any travel agent can look up during validity. Real TK flight numbers, Istanbul routing, no paid ticket required. From $13, delivered in minutes. Accepted on Schengen, UK, US, Canadian, and many other visa files."
      />

      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={processSteps}
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
        subtitle="Other options for Schengen and beyond"
        links={[
          { anchor: 'Dummy ticket for a Schengen visa', href: '/dummy-ticket-schengen-visa', blurb: 'EU Visa Code Article 14 compliant, the most common use case for Istanbul routings.' },
          { anchor: 'Dummy ticket on Lufthansa', href: '/lufthansa-dummy-ticket', blurb: 'Star Alliance partner, Frankfurt or Munich routing for Schengen files.' },
          { anchor: 'Dummy ticket for a Japan visa', href: '/dummy-ticket-japan-visa', blurb: 'Round-trip format for embassy and JAPAN eVISA portal submissions.' },
          { anchor: 'Dummy ticket for a Canada visa', href: '/dummy-ticket-canada-visa', blurb: 'Aligned with IRCC guidance on flight bookings before approval.' },
        ]}
      />

      <Contact
        title={pageData.sections.contact.title}
        text={pageData.sections.contact.text}
      />
    </>
  );
}
