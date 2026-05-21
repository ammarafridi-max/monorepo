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
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import {
  MdOutlineAirplaneTicket,
  MdOutlineHotel,
  MdOutlineLuggage,
} from "react-icons/md";
import Hero from "@travel-suite/frontend-shared/components/sections/v1/Hero";
import AllForms from "@travel-suite/frontend-shared/components/forms/v1/AllForms";
import Process from "@travel-suite/frontend-shared/components/sections/v1/Process";
import About from "@travel-suite/frontend-shared/components/sections/v1/About";
import Benefits from "@travel-suite/frontend-shared/components/sections/v1/Benefits";
import FAQ from "@travel-suite/frontend-shared/components/sections/v1/FAQ";
import Contact from "@travel-suite/frontend-shared/components/sections/v1/Contact";

const benefits = [
  {
    title: "Ready for ImmiAccount Upload",
    text: "A clean PDF with airline names, flight numbers, and IATA codes for Sydney, Melbourne, Brisbane, and Perth. Formatted exactly the way case officers expect to see flight evidence in your file.",
    icon: HiOutlineDocumentCheck,
  },
  {
    title: "Verifiable PNR Through Real Systems",
    text: "Each reservation includes a genuine booking reference generated through recognized GDS platforms. Your PNR can be checked through airline systems during the validity window if the Department or Border Force decides to verify it.",
    icon: HiOutlineCheckBadge,
  },
  {
    title: "Built for Australia's Processing Times",
    text: "Subclass 600 Tourist Stream decisions take 20 to 55 days, and applicants from high-volume markets often wait longer. Our reissue option refreshes your reservation with the same details if the original expires mid-application.",
    icon: HiOutlineClock,
  },
  {
    title: "Cost-Effective Starting at $13",
    text: "The Subclass 600 application fee starts at AUD 195 and biometrics, document prep, and translation costs stack up. Our dummy ticket from $13 satisfies the flight requirement without committing to a $600 to $2,000 airline ticket.",
    icon: HiOutlineBanknotes,
  },
  {
    title: "Supports Your GTE Assessment",
    text: "The Genuine Temporary Entrant test is central to every Subclass 600 decision. A round-trip reservation with a fixed return date helps your GTE case by showing a concrete plan to leave Australia within the visa period.",
    icon: HiOutlineShieldCheck,
  },
  {
    title: "Works Across All Subclass 600 Streams",
    text: "Supports applications for the Tourist Stream, Business Visitor Stream, and Sponsored Family Stream. Also works alongside ETA (Subclass 601) and eVisitor (Subclass 651) applications where proof of travel plans strengthens the case.",
    icon: HiOutlineArrowsRightLeft,
  },
];

const faqs = [
  {
    question:
      "Does the Department of Home Affairs require a flight ticket for the Subclass 600?",
    answer:
      "The Department asks for flight bookings and a detailed travel itinerary as part of the Subclass 600 application. However, official guidance advises applicants to keep travel arrangements flexible until a visa decision is made. A dummy ticket with a verifiable PNR provides the flight evidence the application needs without committing to a non-refundable purchase, which aligns with the Department's own advice on flexible bookings.",
  },
  {
    question:
      "What details does the Australia visa flight reservation include?",
    answer:
      "Your dummy ticket includes passenger name, passport details, airline name, flight numbers, departure and arrival airports with IATA codes, travel dates for each segment, and a six-character PNR booking reference. The itinerary shows a complete round-trip covering your departure, arrival in Australia, and return journey.",
  },
  {
    question:
      "How long should I keep the dummy ticket valid for an Australia visa?",
    answer:
      "Tourist Stream processing typically takes 20 to 55 days, but applicants from certain countries often wait longer. We recommend 14-day validity as a starting point. If your application is still being assessed when the reservation expires, we reissue the ticket with the same travel details so your ImmiAccount file stays current.",
  },
  {
    question: "How does a dummy ticket help with the GTE assessment?",
    answer:
      "The Genuine Temporary Entrant assessment looks at whether you have a genuine intention to visit Australia temporarily. A round-trip reservation with a specific departure date is one piece of evidence showing your plan to leave within the visa period. It works alongside other GTE evidence like employment ties, property ownership, family commitments, and financial stability in your home country.",
  },
  {
    question:
      "Can I use this dummy ticket for a Sponsored Family Stream application?",
    answer:
      "Yes. The Sponsored Family Stream requires the same travel itinerary evidence as the Tourist Stream. Our dummy ticket provides the flight details needed. Note that Sponsored Family Stream applications may require additional documentation from your Australian sponsor, including a bond in some cases, which is separate from the flight reservation.",
  },
  {
    question: "Can I use this dummy ticket to board a flight to Australia?",
    answer:
      "No. A dummy ticket is a temporary reservation for visa application purposes only. It does not include a paid e-ticket, so it cannot be used for airline check-in or boarding. Once your Australian visa is granted, purchase your actual flight ticket for travel.",
  },
];

const pageData = {
  meta: {
    title: "Dummy Ticket for Australia Visa From $13 | Verifiable PNR",
    description:
      "Secure a dummy ticket for your Australia Subclass 600 visa application with a verifiable PNR. Ready for ImmiAccount upload, from $13.",
    canonical: "https://www.dummyticket365.com/dummy-ticket-australia-visa",
  },
  sections: {
    hero: {
      title: "Book Your Dummy Ticket For Australia Visa From $13",
      subtitle:
        "Get a verifiable flight reservation for your Australian visa application without purchasing a non-refundable airline ticket. Ready to upload to your ImmiAccount, with a real PNR that the Department of Home Affairs can verify.",
      form: <AllForms forms={["ticket"]} />,
    },
    process: {
      title: "How to Book Your Dummy Flight Ticket for an Australia Visa?",
      subtitle:
        "Here are three clear steps to get a Subclass 600-compliant flight reservation in minutes:",
    },
    about: {
      title: "About DummyTicket365 Services",
      text: "DummyTicket365 is an international travel documentation service helping visa applicants worldwide get compliant travel documents without making irreversible purchases. Our services are used by travelers applying for Australian, Schengen, UK, US, Canadian, Japanese, and other visas.",
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Ticket for Australia Visa",
          description:
            "Round-trip flight reservation with a verifiable PNR, formatted to support Subclass 600 Visitor Visa applications. Includes IATA codes for major Australian airports. From USD 13.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Verified hotel bookings by email, accepted as proof of accommodation for Australia visa applications. No upfront payment to hotels, delivered instantly alongside your dummy ticket.",
        },
        {
          icon: <MdOutlineLuggage />,
          title: "Onward Tickets",
          description:
            "If your journey involves a transit stop in Singapore, Malaysia, or Thailand requiring proof of onward travel, our onward tickets include a verifiable PNR and are delivered instantly.",
        },
      ],
    },
    benefits: {
      title: "Why Applicants Choose Our Dummy Ticket for Australia Visa",
      subtitle:
        "Australia's immigration process is evidence-based, and case officers assess your entire file as a package. Here is what our service provides:",
      benefits,
    },
    faqs: {
      title: "Frequently Asked Questions",
      subtitle: "Common questions about dummy tickets for Australia visas",
      faqs,
    },
    contact: {
      title: "Questions on our Australia visa dummy tickets?",
      text: "With DummyTicket365, you can secure a flight reservation for your Australia Subclass 600 application that meets the Department of Home Affairs evidence requirements. Our service is available 24/7, and you can contact our support team anytime via email for assistance or document updates.",
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const breadcrumbPaths = [
    { label: "Home", href: "/" },
    { label: "Dummy Ticket for Australia Visa" },
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
          "Formatted for ImmiAccount upload",
          "Delivered in minutes",
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />

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

      <Contact
        title={pageData.sections.contact.title}
        text={pageData.sections.contact.text}
      />
    </>
  );
}
