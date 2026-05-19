import { lazy, Suspense } from "react";
import { buildMetadata } from "@/lib/schema";
import {
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from "@/lib/schema";
import {
  HiOutlineCheckBadge,
  HiOutlineBanknotes,
  HiOutlineDocumentCheck,
  HiOutlineArrowsRightLeft,
  HiOutlineClock,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import {
  MdOutlineAirplaneTicket,
  MdOutlineHotel,
  MdOutlineLuggage,
} from "react-icons/md";
import Hero from "@travel-suite/frontend-shared/components/sections/v1/Hero";
import AllForms from "@travel-suite/frontend-shared/components/forms/v1/AllForms";

const Process = lazy(
  () => import("@travel-suite/frontend-shared/components/sections/v1/Process"),
);
const About = lazy(
  () => import("@travel-suite/frontend-shared/components/sections/v1/About"),
);
const Benefits = lazy(
  () => import("@travel-suite/frontend-shared/components/sections/v1/Benefits"),
);
const FAQ = lazy(
  () => import("@travel-suite/frontend-shared/components/sections/v1/FAQ"),
);
const Contact = lazy(
  () => import("@travel-suite/frontend-shared/components/sections/v1/Contact"),
);

const benefits = [
  {
    title: "Complete Round-Trip Route Details",
    text: "Japanese embassies want a flight reservation covering your full journey: departure from your home country, arrival in Japan, and your return flight. Our dummy ticket includes every segment with real airline names, flight numbers, and IATA codes for NRT (Narita), HND (Haneda), KIX (Kansai), and CTS (Chitose).",
    icon: HiOutlineDocumentCheck,
  },
  {
    title: "Verifiable PNR Through Real Systems",
    text: "Each reservation includes a genuine booking reference generated through recognized GDS platforms. Your PNR can be checked through airline systems during the validity window, giving your application the verification layer Japanese consulates expect.",
    icon: HiOutlineCheckBadge,
  },
  {
    title: "Formatted to Japanese Embassy Standards",
    text: "Japan's Ministry of Foreign Affairs requires flight details and hotel bookings to match precisely. Our reservations are issued in a clean, professional airline format that aligns with embassy documentation standards, whether you apply in person or through the JAPAN eVISA portal.",
    icon: HiOutlineCalendarDays,
  },
  {
    title: "Cost-Effective Starting at $13",
    text: "Japan visa applicants already face costs for the visa fee, accommodation, travel insurance, and document preparation. Our dummy ticket from $13 meets the flight reservation requirement without adding a long-haul airfare to your upfront expenses before approval.",
    icon: HiOutlineBanknotes,
  },
  {
    title: "Validity Options That Match Processing Times",
    text: "Japan visa processing takes a minimum of 5 business days, but consulates often take 1 to 3 weeks depending on nationality and application volume. Choose 48-hour, 7-day, or 14-day validity to stay covered through review, with a reissue option if processing runs longer.",
    icon: HiOutlineClock,
  },
  {
    title: "Works for All Japan Visa Categories",
    text: "Supports short-term tourist visas, business visas, transit visas, and visiting friends or relatives. Also works with the JAPAN eVISA portal for eligible nationalities applying for single-entry tourism visas online.",
    icon: HiOutlineArrowsRightLeft,
  },
];

const faqs = [
  {
    question:
      "Do Japanese embassies accept a flight reservation instead of a paid ticket?",
    answer:
      "Yes. Japanese embassies and consulates require a flight reservation showing your travel dates and route as part of the visa application. The Ministry of Foreign Affairs lists flight reservation information as a required document. You do not need to purchase a fully paid ticket at the application stage, and embassies advise against making non-refundable travel purchases before a visa decision.",
  },
  {
    question: "What details does the Japan visa flight reservation include?",
    answer:
      "Your dummy ticket includes passenger name, passport details, airline name, flight numbers, departure and arrival airports with IATA codes, travel dates for each segment, and a six-character PNR booking reference. The reservation shows a complete round-trip itinerary covering your departure, arrival in Japan, and return journey.",
  },
  {
    question: "How long should I keep the dummy ticket valid for a Japan visa?",
    answer:
      "Japan visa processing takes a minimum of 5 business days, but many consulates take 1 to 3 weeks depending on nationality and application volume. We recommend 7-day or 14-day validity to keep the PNR active while your application is reviewed. If the reservation expires before a decision, we can reissue it with the same travel details.",
  },
  {
    question: "Can I use this dummy ticket for the JAPAN eVISA system?",
    answer:
      "Yes. The JAPAN eVISA portal requires applicants to enter flight reservation details during the online application. Our dummy ticket provides the flight information, airline details, and booking reference you need to complete those fields. The eVISA system is currently available for single-entry tourism visas for eligible nationalities.",
  },
  {
    question:
      "My Japan visa requires a hotel booking that matches my flight dates. Can you help?",
    answer:
      "Yes. We issue verified hotel reservations alongside dummy tickets. Japanese consulates check that your hotel booking and flight itinerary match in dates and duration, so ordering both together keeps your travel dates consistent across all documents. Hotel reservations are delivered by email in the same format embassies expect.",
  },
  {
    question: "Can I use this dummy ticket to board a flight to Japan?",
    answer:
      "No. A dummy ticket is a temporary reservation for visa application purposes only. It does not include a paid e-ticket, so it cannot be used for airline check-in or boarding. Once your Japan visa is approved, purchase your actual flight ticket for travel.",
  },
];

const pageData = {
  meta: {
    title: "Dummy Ticket for Japan Visa From $13 | Verifiable PNR",
    description:
      "Secure a dummy ticket for your Japan visa application with a verifiable PNR. Formatted for embassy and eVISA submissions, from $13.",
    canonical: "https://www.dummyticket365.com/dummy-ticket-japan-visa",
  },
  sections: {
    hero: {
      title: "Book Your Dummy Ticket For Japan Visa From $13",
      subtitle:
        "Get a verifiable flight reservation for your Japan visa application without purchasing a non-refundable airline ticket. Japanese embassies require a round-trip itinerary, and our dummy ticket is formatted to meet that requirement with a real, checkable PNR.",
      form: <AllForms forms={["ticket"]} />,
    },
    process: {
      title: "How to Book Your Dummy Flight Ticket for a Japan Visa?",
      subtitle:
        "Here are three clear steps to get an embassy-ready flight reservation in minutes:",
    },
    about: {
      title: "About DummyTicket365 Services",
      text: "DummyTicket365 is an international travel documentation service helping visa applicants worldwide get the documents they need without making irreversible travel purchases. Our services are used by travelers applying for Japan, Schengen, UK, US, Canadian, Australian, and other visas.",
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Ticket for Japan Visa",
          description:
            "Round-trip flight reservation with a verifiable PNR, formatted to meet Japanese embassy and eVISA requirements. Includes IATA codes for major Japanese airports. From USD 13.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Verified hotel bookings by email, accepted as proof of accommodation for Japan visa applications. Dates aligned with your flight reservation, delivered instantly.",
        },
        {
          icon: <MdOutlineLuggage />,
          title: "Onward Tickets",
          description:
            "If you are transiting through a country that requires proof of onward travel before reaching Japan, our onward tickets include a verifiable PNR and are delivered instantly.",
        },
      ],
    },
    benefits: {
      title: "Why Applicants Choose Our Dummy Ticket for Japan Visa",
      subtitle:
        "Japan's visa process is detail-oriented, and your documents need to reflect that. Here is what our service provides:",
      benefits,
    },
    faqs: {
      title: "Frequently Asked Questions",
      subtitle: "Common questions about dummy tickets for Japan visas",
      faqs,
    },
    contact: {
      title: "Questions on our Japan visa dummy tickets?",
      text: "With DummyTicket365, you can secure a flight reservation for your Japan visa application that meets embassy requirements. Our service is available 24/7, and you can contact our support team anytime via email for assistance or document updates.",
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const breadcrumbPaths = [
    { label: "Home", href: "/" },
    { label: "Dummy Ticket for Japan Visa" },
  ];

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(pageData.meta),
    buildService({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      areaServed: "AE",
    }),
    buildProduct({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      price: "13.00",
      currency: "USD",
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
          "Dummy tickets from $13",
          "Verifiable PNR included",
          "Round-trip format for Japan visa",
          "Delivered in minutes",
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />

      <Suspense fallback={null}>
        <Process
          title={pageData.sections.process.title}
          subtitle={pageData.sections.process.subtitle}
        />
      </Suspense>

      <Suspense fallback={null}>
        <About
          title={pageData.sections.about.title}
          text={pageData.sections.about.text}
          services={pageData.sections.about.services}
        />
      </Suspense>

      <Suspense fallback={null}>
        <Benefits
          title={pageData.sections.benefits.title}
          subtitle={pageData.sections.benefits.subtitle}
          benefits={pageData.sections.benefits.benefits}
        />
      </Suspense>

      <Suspense fallback={null}>
        <FAQ
          title={pageData.sections.faqs.title}
          subtitle={pageData.sections.faqs.subtitle}
          faqs={pageData.sections.faqs.faqs}
        />
      </Suspense>

      <Suspense fallback={null}>
        <Contact
          title={pageData.sections.contact.title}
          text={pageData.sections.contact.text}
        />
      </Suspense>
    </>
  );
}
