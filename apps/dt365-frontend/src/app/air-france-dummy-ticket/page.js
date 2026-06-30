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
import QuickAnswer from '@/components/QuickAnswer';
import RelatedPages from '@/components/RelatedPages';

const processSteps = [
  {
    title: 'Tell us your route',
    text: 'Enter your departure city, destination, and travel dates. Air France operates its main hub at Paris Charles de Gaulle (CDG), with additional short-haul services from Paris Orly (ORY). Enter your full journey including any connections through Paris.',
  },
  {
    title: 'Choose your validity',
    text: 'Pick the validity period that matches your visa processing timeline. Schengen applications at French missions typically take 15 to 45 days. Choose 7-day or 14-day validity to keep the PNR active during review, with reissue options if processing runs longer.',
  },
  {
    title: 'Pay and receive instantly',
    text: 'Complete your secure payment and your Air France flight reservation arrives in your inbox within minutes. The PDF includes your PNR, passenger name, AF flight numbers, IATA airport codes, cabin class, and a round-trip itinerary ready for visa submission.',
  },
];

const benefits = [
  {
    title: "France's Flag Carrier With Over Nine Decades of History",
    text: 'Air France is the national airline of France and has been operating since 1933. Visa officers at embassies worldwide recognize AF instantly, and an Air France itinerary carries inherent credibility. For Schengen visa applications filed at a French embassy or consulate, it is the most logical carrier choice an applicant can make.',
    icon: HiOutlineCheckBadge,
  },
  {
    title: 'Verifiable PNR on GDS Systems',
    text: 'Each reservation is created through recognized GDS platforms (Amadeus, Sabre, Travelport). During the validity window, visa officers and consulates can check the PNR through the same GDS systems they routinely use to confirm flight reservations.',
    icon: HiOutlineGlobeAlt,
  },
  {
    title: 'Paris CDG Is a Major Global Hub',
    text: "Charles de Gaulle is one of Europe's largest airports and serves as Air France's main long-haul hub. AF connects Paris to nearly 200 destinations across six continents, making almost any origin or destination routable through Paris — useful for Schengen, North American, African, and Asian itineraries alike.",
    icon: HiOutlineBuildingOffice2,
  },
  {
    title: 'Founding Member of SkyTeam Alliance',
    text: 'Air France co-founded SkyTeam in 2000 alongside Delta, KLM, Korean Air, and Aeromexico. The alliance now includes 19 member airlines. An Air France PNR can include codeshare segments on Delta, KLM, Korean Air, Aeromexico, China Eastern, Saudia, and more, all within a single booking.',
    icon: HiOutlineUserGroup,
  },
  {
    title: 'Part of the Air France-KLM Group',
    text: 'Air France and KLM operate as a unified group with a transatlantic joint venture alongside Delta and Virgin Atlantic. Codeshare flights across these carriers are common, particularly on European and transatlantic routes — an AF booking can include KLM segments via Amsterdam under a single PNR.',
    icon: HiOutlineArrowsRightLeft,
  },
  {
    title: 'Strong Direct Network From Key Visa Markets',
    text: 'Air France operates direct flights from cities with high visa application volumes, including Delhi, Mumbai, Bengaluru, Lagos, Abidjan, Dakar, Johannesburg, Dubai, Riyadh, Tokyo, Seoul, and Shanghai. Applicants from these cities see AF as a direct, established option for any Europe-bound itinerary.',
    icon: HiOutlineMapPin,
  },
];

const faqs = [
  {
    question: 'Can the Air France dummy ticket PNR be verified?',
    answer:
      'Yes. Each reservation is issued through recognized GDS platforms (Amadeus, Sabre, Travelport) and includes a six-character PNR that visa officers, consulates, and travel agents can check on the same GDS systems during the selected validity period.',
  },
  {
    question: 'Is an Air France dummy ticket accepted for Schengen visa applications?',
    answer:
      'Air France itineraries are widely used and accepted for Schengen visa applications submitted at French embassies and consulates worldwide, as well as at VFS, TLScontact, and BLS centers. The EU Visa Code permits flight reservations rather than paid tickets at the application stage. Final acceptance depends on the consulate handling your application.',
  },
  {
    question: 'What if my Air France booking includes segments on KLM or Delta?',
    answer:
      'Air France and KLM are part of the same group, and AF has a transatlantic joint venture with Delta. Codeshare segments operated by these carriers can be included in a single AF booking. Your AF PNR may contain segments with a KL (KLM) or DL (Delta) flight number, all under the same booking code.',
  },
  {
    question: 'How long does the Air France dummy ticket stay valid?',
    answer:
      'You can choose from 48-hour, 7-day, or 14-day validity at the time of booking. The PNR remains active and verifiable on GDS systems during this period. If your visa processing takes longer than expected, we can reissue the reservation with the same travel details and a fresh booking reference.',
  },
  {
    question: 'Does the dummy ticket show real Air France flight numbers?',
    answer:
      'Yes. Each dummy ticket is based on actual Air France flights with real AF flight numbers, accurate departure and arrival times, correct IATA airport codes, and a realistic cabin class. The itinerary reflects a genuine route that Air France operates between Paris and your departure or destination city.',
  },
  {
    question: 'Can I use this dummy ticket to board an Air France flight?',
    answer:
      'No. A dummy ticket is a temporary reservation for visa application purposes only. It does not include a paid e-ticket, so it cannot be used for check-in or boarding. Once your visa is approved, purchase your actual Air France ticket directly on airfrance.com, through the Air France app, or via any travel agent.',
  },
];

const pageData = {
  meta: {
    title: 'Book a Dummy Ticket on Air France from $13 | Verifiable PNR',
    description:
      'Get a verifiable Air France flight reservation for your visa application from $13. PNR generated through recognized GDS systems and delivered to your inbox in minutes.',
    canonical: 'https://www.dummyticket365.com/air-france-dummy-ticket',
  },
  sections: {
    hero: {
      title: 'Book a Dummy Ticket on Air France from $13',
      subtitle:
        "Get a verifiable Air France flight reservation for your visa application without purchasing a non-refundable ticket. As France's flag carrier and a founding member of SkyTeam, Air France is one of the most natural carrier choices for Schengen visa itineraries through Paris.",
      form: <AllForms forms={['ticket']} />,
    },
    process: {
      title: 'How to Book Your Air France Dummy Ticket',
      subtitle:
        'Air France itineraries are a natural fit for Schengen visa applications, especially when France is your main destination or transit point. Here is how to get yours:',
    },
    about: {
      title: 'About DummyTicket365 Services',
      text: 'DummyTicket365 is an international travel documentation service helping visa applicants worldwide with verifiable flight reservations. Our Air France dummy tickets are used by travelers applying for Schengen, UK, US, Canadian, Australian, and other visas where a flight itinerary is required.',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Air France Dummy Ticket',
          description:
            'A round-trip flight reservation on Air France with a verifiable PNR. The reservation is created through recognized GDS platforms (Amadeus, Sabre, Travelport) so consulates and travel agents can confirm the booking during validity. Instant delivery from $13.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Schengen Travel Insurance',
          description:
            'Genuine Schengen-compliant travel insurance with the required EUR 30,000 minimum medical coverage. Since Air France itineraries are most commonly used for Schengen applications, bundling your dummy ticket with compliant insurance gives you two essential documents in one order.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Temporary hotel reservations formatted to Schengen embassy and consulate standards. Like dummy tickets, these are real reservations — not paid bookings — so your French visa file is complete without locking in non-refundable nights before approval.',
        },
      ],
    },
    benefits: {
      title: 'Why Travelers Choose Air France for Visa Itineraries',
      subtitle:
        'Air France carries a level of recognition and credibility with visa officers that few airlines match. Here is why it appears on so many applications.',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about Air France dummy tickets',
      faqs,
    },
    contact: {
      title: 'Questions on your Air France dummy ticket?',
      text: 'Our team is available 24/7. If you need to confirm a routing through Paris, adjust dates, or extend a PNR during your visa processing window, email us and we will get back to you the same day.',
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Air France Dummy Ticket' },
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
          '190+ destinations worldwide',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />

      <QuickAnswer
        question="Can you get a verifiable Air France reservation without buying a ticket?"
        answer="Yes. We issue Air France flight reservations through global GDS platforms (Amadeus, Sabre, Travelport) with a six-character PNR your consulate or any travel agent can look up during validity. Real AF flight numbers, real CDG routing, no paid ticket required. From $13, in your inbox in minutes. Suitable for Schengen visa files and any embassy that asks for proof of travel."
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
          { anchor: 'Dummy ticket for a Schengen visa', href: '/dummy-ticket-schengen-visa', blurb: 'EU Visa Code Article 14 compliant, the natural pairing for an Air France itinerary.' },
          { anchor: 'Dummy ticket on Turkish Airlines', href: '/turkish-airlines-dummy-ticket', blurb: 'Istanbul routing, accepted on Schengen, UK, US, and Canadian visa files.' },
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
