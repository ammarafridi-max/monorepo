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
  MdOutlineHealthAndSafety,
} from "react-icons/md";
import Hero from "@travel-suite/frontend-shared/components/sections/v1/Hero";
import AllForms from "@travel-suite/frontend-shared/components/forms/v1/AllForms";
import Process from "@travel-suite/frontend-shared/components/sections/v1/Process";
import About from "@travel-suite/frontend-shared/components/sections/v1/About";
import Benefits from "@travel-suite/frontend-shared/components/sections/v1/Benefits";
import FAQ from "@travel-suite/frontend-shared/components/sections/v1/FAQ";
import Contact from "@travel-suite/frontend-shared/components/sections/v1/Contact";
import QuickAnswer from "@/components/QuickAnswer";
import RelatedPages from "@/components/RelatedPages";

const benefits = [
  {
    title: "Ready for the IRCC Online Portal",
    text: "A clean PDF with airline names, flight numbers, and IATA codes for Toronto Pearson (YYZ), Vancouver (YVR), Montreal (YUL), and Calgary (YYC). The exact details IRCC asks for in the online travel itinerary section.",
    icon: HiOutlineDocumentCheck,
  },
  {
    title: "Verifiable PNR Through Real Systems",
    text: "Each reservation carries a verifiable PNR on global GDS platforms (Amadeus, Sabre, Travelport). IRCC or CBSA, like any IATA-accredited travel agent, can look it up on the same systems during the validity window.",
    icon: HiOutlineCheckBadge,
  },
  {
    title: "Built for Canada's Long Processing Times",
    text: "Canadian visitor visa processing ranges from 2 weeks to over 100 days depending on your country of residence. Our reissue option refreshes your reservation with the same details if the original expires while your TRV is still under review.",
    icon: HiOutlineClock,
  },
  {
    title: "Cost-Effective Starting at $13",
    text: "Between the $100 CAD IRCC fee and the $85 CAD biometrics charge, Canada visa costs add up quickly. Our dummy ticket from $13 meets the flight itinerary requirement without committing to a $500 to $1,500 airline ticket months before your visa decision.",
    icon: HiOutlineBanknotes,
  },
  {
    title: "Aligned With IRCC Guidance",
    text: "IRCC explicitly advises applicants not to finalize travel arrangements before receiving a visa. A dummy ticket follows that guidance: you provide the travel details IRCC needs while keeping your finances uncommitted until you have an approved TRV.",
    icon: HiOutlineShieldCheck,
  },
  {
    title: "Works Across All Canadian Visa Categories",
    text: "Supports visitor visas (TRV), Super Visas for parents and grandparents, study permit initial entries, business visas, and Canadian transit visas. A verifiable reservation satisfies the travel itinerary requirement across the board.",
    icon: HiOutlineArrowsRightLeft,
  },
];

const faqs = [
  {
    question: "Does IRCC require a flight ticket for a Canada visitor visa?",
    answer:
      "IRCC asks applicants to provide travel itinerary details, including flight information, as part of the online application. However, IRCC also advises applicants not to finalize travel bookings until the visa is approved. A dummy ticket with a verifiable PNR provides the flight details the application requires without committing to a paid ticket, which aligns with IRCC's own published guidance.",
  },
  {
    question: "What details does the Canada visa flight reservation include?",
    answer:
      "Your dummy ticket includes passenger name, passport details, airline name, flight numbers, departure and arrival airports with IATA codes, travel dates for each segment, and a six-character PNR booking reference. The itinerary shows a complete round-trip covering your departure, arrival in Canada, and return journey.",
  },
  {
    question:
      "How long should I keep the dummy ticket valid for a Canada visa?",
    answer:
      "Canadian visa processing times are among the longest globally, ranging from 2 weeks to several months depending on your country of residence. We recommend starting with 14-day validity. If your application is still in progress when the reservation expires, we can reissue the ticket with the same travel details so your file remains consistent.",
  },
  {
    question: "Can I use this dummy ticket for a Super Visa application?",
    answer:
      "Yes. The Super Visa for parents and grandparents of Canadian citizens and permanent residents requires a travel itinerary as part of the application. Our dummy ticket provides the flight details needed. Note that Super Visa applications also require proof of Canadian medical insurance with a minimum coverage of $100,000 CAD, which is a separate requirement from the flight reservation.",
  },
  {
    question:
      "Will CBSA ask about my flight reservation when I arrive in Canada?",
    answer:
      "CBSA officers often ask to see your return ticket at the border. By the time you arrive in Canada, you will have a real paid ticket because your visa would already be approved. The dummy ticket is for the application stage only. Once your TRV is granted, purchase your actual flight and carry that confirmation for entry at the Canadian border.",
  },
  {
    question: "Can I use this dummy ticket to board a flight to Canada?",
    answer:
      "No. A dummy ticket is a temporary reservation for visa application purposes only. It does not include a paid e-ticket, so it cannot be used for airline check-in or boarding. Once your Canada visa is approved, purchase your actual flight ticket for travel.",
  },
];

const pageData = {
  meta: {
    title: "Dummy Ticket for Canada Visa From $13 | Verifiable PNR",
    description:
      "Secure a dummy ticket for your Canada visitor visa or TRV application with a verifiable PNR. Aligned with IRCC guidance, from $13.",
    canonical: "https://www.dummyticket365.com/dummy-ticket-canada-visa",
  },
  sections: {
    hero: {
      title: "Book Your Dummy Ticket For Canada Visa From $13",
      subtitle:
        "Get a verifiable flight reservation for your Canadian visa application without purchasing a non-refundable ticket. IRCC asks for flight details but advises against booking before approval, and our dummy ticket follows that guidance exactly.",
      form: <AllForms forms={["ticket"]} />,
    },
    process: {
      title: "How to Book Your Dummy Flight Ticket for a Canada Visa?",
      subtitle:
        "Here are three clear steps to get an IRCC-ready flight reservation in minutes:",
    },
    about: {
      title: "About DummyTicket365 Services",
      text: "DummyTicket365 is an international travel documentation service helping visa applicants worldwide get compliant travel documents without making irreversible purchases. Our services are used by travelers applying for Canadian, Schengen, UK, US, Japanese, and other visas.",
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Ticket for Canada Visa",
          description:
            "Round-trip flight reservation with a verifiable PNR, formatted to support Canadian TRV and Super Visa applications. Includes IATA codes for major Canadian airports. From USD 13.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Verified hotel bookings by email, accepted as proof of accommodation for Canada visa applications. No upfront payment to hotels, delivered instantly alongside your dummy ticket.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Insurance",
          description:
            "Genuine travel insurance for your Canada trip. Provincial health plans don't cover visitors, so a real medical policy matters once you arrive — and a clean certificate adds weight to the visa file too. Delivered instantly.",
        },
      ],
    },
    benefits: {
      title: "Why Applicants Choose Our Dummy Ticket for Canada Visa",
      subtitle:
        "Canada's immigration system is thorough, and IRCC officers assess your entire application as a package. Here is what our service provides:",
      benefits,
    },
    faqs: {
      title: "Frequently Asked Questions",
      subtitle: "Common questions about dummy tickets for Canada visas",
      faqs,
    },
    contact: {
      title: "Questions on our Canada visa dummy tickets?",
      text: "With DummyTicket365, you can secure a flight reservation for your Canadian TRV or Super Visa application that meets IRCC's travel itinerary requirement. Our service is available 24/7, and you can contact our support team anytime via email for assistance or document updates.",
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const breadcrumbPaths = [
    { label: "Home", href: "/" },
    { label: "Dummy Ticket for Canada Visa" },
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
          "Formatted for IRCC applications",
          "Delivered in minutes",
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />

      <QuickAnswer
        question="Do you need a flight itinerary for a Canada visa?"
        answer="Yes. IRCC asks for travel dates and a flight itinerary in the visitor visa application, and at the same time advises against booking flights before the visa is approved. A dummy ticket fits that guidance exactly. You get a verifiable PNR on global GDS platforms for the file, without locking in a paid ticket while IRCC reviews."
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

      <RelatedPages
        title="Related Dummy Ticket Pages"
        subtitle="Other visa applications we support"
        links={[
          { anchor: 'Dummy ticket for an Australia visa', href: '/dummy-ticket-australia-visa', blurb: 'Formatted for the Subclass 600 ImmiAccount upload.' },
          { anchor: 'Dummy ticket for a Japan visa', href: '/dummy-ticket-japan-visa', blurb: 'Round-trip format for embassy and JAPAN eVISA portal submissions.' },
          { anchor: 'Dummy ticket for a UK visa', href: '/dummy-ticket-uk-visa', blurb: 'Standard Visitor visa file ready, no paid ticket needed before approval.' },
          { anchor: 'Dummy ticket for a Schengen visa', href: '/dummy-ticket-schengen-visa', blurb: 'EU Visa Code Article 14 compliant, accepted at VFS, BLS, and TLScontact.' },
        ]}
      />

      <Contact
        title={pageData.sections.contact.title}
        text={pageData.sections.contact.text}
      />
    </>
  );
}
