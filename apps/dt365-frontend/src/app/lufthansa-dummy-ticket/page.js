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
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineArrowsRightLeft,
  HiOutlineMapPin,
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
// import QuickAnswer from '@/components/QuickAnswer';
import RelatedPages from '@/components/RelatedPages';

const processSteps = [
  {
    title: 'Tell us your route',
    text: 'Enter your departure city, destination, and travel dates. Lufthansa operates dual hubs at Frankfurt (FRA) and Munich (MUC), connecting travelers to over 220 destinations. Enter the full route including any connections.',
  },
  {
    title: 'Choose your validity',
    text: 'Pick the validity period that fits your visa processing timeline. Schengen applications at German missions typically take 10 to 15 working days. Choose 7-day or 14-day validity to stay covered, with reissue options if processing extends.',
  },
  {
    title: 'Pay and receive instantly',
    text: 'Complete your secure payment and your Lufthansa flight reservation arrives in your inbox within minutes. The PDF includes your PNR, passenger name, LH flight numbers, IATA airport codes, fare class, and a round-trip itinerary ready for visa submission.',
  },
];

const benefits = [
  {
    title: "Germany's Flag Carrier With a Century of Heritage",
    text: 'Lufthansa has been operating since 1953, with roots in the original Deutsche Luft Hansa founded in 1926. For Schengen visa applications filed at a German embassy or consulate, a Lufthansa itinerary is the most logical and credible carrier choice an applicant can make.',
    icon: HiOutlineCheckBadge,
  },
  {
    title: 'Verifiable PNR on GDS Systems',
    text: 'Each reservation is created through recognized GDS platforms (Amadeus, Sabre, Travelport). During the validity window, visa officers and consulates can check the PNR through the same GDS systems they routinely use to confirm flight reservations.',
    icon: HiOutlineGlobeAlt,
  },
  {
    title: 'Dual Hubs at Frankfurt and Munich',
    text: 'Frankfurt is one of the busiest airports in Europe and serves as Lufthansa\'s primary international hub, while Munich handles a strong mix of European and intercontinental routes. The dual-hub structure gives applicants two major connection points and routing flexibility.',
    icon: HiOutlineBuildingOffice2,
  },
  {
    title: 'Founding Member of Star Alliance',
    text: 'Lufthansa co-founded the Star Alliance in 1997. A Lufthansa PNR can include codeshare segments on partner carriers like United, Air Canada, ANA, Singapore Airlines, and Turkish Airlines, all within a single booking.',
    icon: HiOutlineUserGroup,
  },
  {
    title: 'Lufthansa Group Covers Multiple European Carriers',
    text: 'The group operates SWISS, Austrian Airlines, Brussels Airlines, Eurowings, and Lufthansa City Airlines. A Lufthansa booking can include segments operated by SWISS through Zurich, Austrian through Vienna, or Brussels Airlines through Brussels under a single LH PNR.',
    icon: HiOutlineArrowsRightLeft,
  },
  {
    title: 'Direct Routes From High-Volume Visa Markets',
    text: 'Lufthansa operates direct flights from cities where Schengen demand is highest — Delhi, Mumbai, Bengaluru, Dubai, Riyadh, Lagos, Johannesburg, Tokyo, Seoul, and Bangkok — so the itinerary looks natural and credible for applicants in those markets.',
    icon: HiOutlineMapPin,
  },
];

const faqs = [
  {
    question: 'Can the Lufthansa dummy ticket PNR be verified?',
    answer:
      'Yes. Each reservation is issued through recognized GDS platforms (Amadeus, Sabre, Travelport) and includes a six-character PNR that visa officers, consulates, and travel agents can check on the same GDS systems during the selected validity period.',
  },
  {
    question: 'Is a Lufthansa dummy ticket accepted for Schengen visa applications?',
    answer:
      'Lufthansa itineraries are widely used and accepted for Schengen visa applications at German embassies and consulates worldwide, as well as at VFS and TLScontact centers. The EU Visa Code permits flight reservations rather than paid tickets at the application stage. Final acceptance depends on the consulate handling your application.',
  },
  {
    question: 'What if my Lufthansa booking includes segments on SWISS or Austrian Airlines?',
    answer:
      'Lufthansa, SWISS, Austrian Airlines, and Brussels Airlines are all part of the Lufthansa Group, so codeshare segments operated by group carriers can be included in a single Lufthansa booking. Your LH PNR may contain segments with an LX (SWISS), OS (Austrian), or SN (Brussels Airlines) flight number, all under the same booking code.',
  },
  {
    question: 'How long does the Lufthansa dummy ticket stay valid?',
    answer:
      'You can choose from 48-hour, 7-day, or 14-day validity at the time of booking. The PNR remains active and verifiable on GDS systems during this period. If your visa processing takes longer than expected, we can reissue the reservation with the same travel details and a fresh booking code.',
  },
  {
    question: 'Does the dummy ticket show real Lufthansa flight numbers?',
    answer:
      'Yes. Each dummy ticket is based on actual Lufthansa flights with real LH flight numbers, accurate departure and arrival times, correct IATA airport codes, and a realistic fare class. The itinerary reflects a genuine route that Lufthansa operates between its hubs and your departure or destination city.',
  },
  {
    question: 'Can I use this dummy ticket to board a Lufthansa flight?',
    answer:
      'No. A dummy ticket is a temporary reservation for visa application purposes only. It does not include a paid e-ticket, so it cannot be used for check-in or boarding. Once your visa is approved, purchase your actual Lufthansa ticket directly on lufthansa.com, through the Lufthansa app, or via any travel agent.',
  },
];

const pageData = {
  meta: {
    title: 'Book a Dummy Ticket on Lufthansa from $13 | Verifiable PNR',
    description:
      'Get a verifiable Lufthansa flight reservation for your visa application from $13. PNR generated through recognized GDS systems and delivered to your inbox in minutes.',
    canonical: 'https://www.dummyticket365.com/lufthansa-dummy-ticket',
  },
  sections: {
    hero: {
      title: 'Book a Dummy Ticket on Lufthansa from $13',
      subtitle:
        'Get a verifiable Lufthansa flight reservation for your visa application without purchasing a non-refundable ticket. As Germany\'s flag carrier and a founding member of Star Alliance, Lufthansa is one of the most frequently used airlines on Schengen visa itineraries.',
      form: <AllForms forms={['ticket']} />,
    },
    process: {
      title: 'How to Book Your Lufthansa Dummy Ticket',
      subtitle:
        'Lufthansa itineraries are a natural choice for Schengen applications, particularly when Germany is your main destination or transit point. Here is how to get yours:',
    },
    about: {
      title: 'About DummyTicket365 Services',
      text: 'DummyTicket365 is an international travel documentation service helping visa applicants worldwide with verifiable flight reservations. Our Lufthansa dummy tickets are used by travelers applying for Schengen, UK, US, Canadian, and other visas where a flight itinerary is required.',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Lufthansa Dummy Ticket',
          description:
            'A round-trip flight reservation on Lufthansa with a verifiable PNR. The reservation is created through recognized GDS platforms (Amadeus, Sabre, Travelport) so consulates and travel agents can confirm the booking during validity. Instant delivery from $13.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Schengen Travel Insurance',
          description:
            'Genuine Schengen-compliant travel insurance with the required EUR 30,000 minimum medical coverage. Since Lufthansa itineraries are most commonly used for Schengen applications, bundling your dummy ticket with compliant insurance gives you two essential documents in one order.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Temporary hotel reservations formatted to Schengen embassy and consulate standards. Like dummy tickets, these are real reservations — not paid bookings — so your visa file is complete without locking in non-refundable nights before approval.',
        },
      ],
    },
    benefits: {
      title: 'Why Travelers Choose Lufthansa for Visa Itineraries',
      subtitle:
        'Lufthansa is the default airline on countless Schengen visa applications, and its position in the European market makes it a strong choice for any visa requiring proof of travel.',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about Lufthansa dummy tickets',
      faqs,
    },
    contact: {
      title: 'Questions on your Lufthansa dummy ticket?',
      text: 'Our team is available 24/7. If you need to confirm a routing, adjust dates, or extend a PNR during your visa processing window, email us and we will get back to you the same day.',
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Lufthansa Dummy Ticket' },
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
          '220+ destinations in 70 countries',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />

      {/* <QuickAnswer
        question="Can you get a verifiable Lufthansa reservation without buying a ticket?"
        answer="Yes. We issue Lufthansa flight reservations through global GDS platforms (Amadeus, Sabre, Travelport) with a six-character PNR that German consulates and travel agents can confirm during validity. Real LH flight numbers, Frankfurt or Munich routing, no paid ticket required. From $13, in your inbox in minutes. Schengen-ready and accepted at VFS and TLScontact German visa centres."
      /> */}

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
          { anchor: 'Dummy ticket for a Schengen visa', href: '/dummy-ticket-schengen-visa', blurb: 'EU Visa Code Article 14 compliant, the most common use case for Lufthansa itineraries.' },
          { anchor: 'Dummy ticket on Air France', href: '/air-france-dummy-ticket', blurb: 'SkyTeam routing via Paris CDG, also Schengen-ready.' },
          { anchor: 'Dummy ticket for a Canada visa', href: '/dummy-ticket-canada-visa', blurb: 'Aligned with IRCC guidance on flight bookings before approval.' },
          { anchor: 'Dummy ticket for an Australia visa', href: '/dummy-ticket-australia-visa', blurb: 'Formatted for the Subclass 600 ImmiAccount upload.' },
        ]}
      />

      <Contact
        title={pageData.sections.contact.title}
        text={pageData.sections.contact.text}
      />
    </>
  );
}
