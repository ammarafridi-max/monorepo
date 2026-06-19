import Link from "next/link";
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from "react-icons/md";
import {
  ShieldCheck,
  FileCheck,
  Zap,
  HeartPulse,
  Banknote,
  RefreshCw,
} from "lucide-react";
import Container from "@travel-suite/frontend-shared/components/shared/layout/Container";
import PrimarySection from "@travel-suite/frontend-shared/components/shared/layout/PrimarySection";
import SectionTitle from "@travel-suite/frontend-shared/components/shared/layout/SectionTitle";
import About from "@travel-suite/frontend-shared/components/sections/v2/About";
import Benefits from "@travel-suite/frontend-shared/components/sections/v2/Benefits";
import Testimonials from "@travel-suite/frontend-shared/components/sections/v2/Testimonials";
import Faqs from "@travel-suite/frontend-shared/components/sections/v2/Faqs";
import Hero from "@travel-suite/frontend-shared/components/sections/v2/Hero";
import HowItWorks from "@travel-suite/frontend-shared/components/sections/v2/HowItWorks";
import { buildMetadata } from "@/lib/schema";
import {
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from "@/lib/schema";

export const processSteps = [
  {
    title: "Enter Your Trip Details",
    text: "Choose your travel dates for Germany, pick Europe as the destination, and add each traveler. The form is set up to meet what the German consulate expects to see.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's name and passport details exactly as on the passport. The German consulate is strict about matching, so a typo is a quick way to slow the application down.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your Germany-ready AXA certificate arrives by email within minutes. Print it and bring it to your VFS Germany appointment the same day.",
  },
];

const testimonials = [
  {
    quote:
      "Heard the German consulate is the strictest of the Schengen ones. The AXA certificate from Travl had EUR 30,000 stated clearly and listed the full Schengen Area. VFS Germany ticked the box and moved on.",
    name: "Tariq R.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Germany Visa Insurance",
  },
  {
    quote:
      "Business trip to Munich, two weeks notice. Got everything sorted online in one evening — insurance, flight reservation, hotel booking. Visa came back in eleven days.",
    name: "Aditya M.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Germany Visa Insurance",
  },
  {
    quote:
      "Applied for a family visit visa for Berlin. Three certificates, three minutes to download all of them, every name matched. VFS officer didn't ask a single question about the insurance.",
    name: "Noor K.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Germany Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Meets German Consulate Requirements",
    text: "EUR 30,000 medical coverage across the entire Schengen Area, including Germany, written exactly the way the German consulate and VFS Germany expect.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "A genuine AXA travel medical policy. Valid for your Germany visa submission and for real medical emergencies during your trip.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate arrives by email within minutes of payment. Submit at VFS Germany the same day with no waiting.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency treatment, hospitalization, repatriation, baggage, trip cancellation, and travel delays are all included.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "Germany visa insurance plans that meet the consulate's requirements without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to Germany once, or to Europe regularly? Single-trip or annual multi-trip plans are both available.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for a Germany visa?",
    answer:
      "Yes. The German consulate requires travel insurance for every Schengen short-stay (Type C) visa application. The policy must include at least EUR 30,000 in medical coverage, be valid throughout the Schengen Area, and cover the full duration of your trip.",
  },
  {
    question: "Is the German consulate strict about insurance wording?",
    answer:
      "Yes, more so than most. They want to see the EUR 30,000 figure stated clearly, the Schengen Area mentioned explicitly, and trip dates that cover your full stay. Our certificates are written to address all three.",
  },
  {
    question: "Is this insurance accepted by VFS Global Germany?",
    answer:
      "Yes. Germany visa applications in the UAE go through VFS Global Germany in Dubai and Abu Dhabi. Our certificates are formatted exactly the way VFS Germany and the German consulate expect.",
  },
  {
    question: "Does this work for tourist, business, and family visit visas?",
    answer:
      "Yes. The same EUR 30,000 Schengen cover applies across all Germany short-stay visa categories — tourism, business, family visit, or visiting friends.",
  },
  {
    question: "Does this cover a German long-stay (national) visa?",
    answer:
      "German national visas — for study, work, family reunification, or stays over 90 days — usually require a specific long-stay insurance product, not a Schengen short-stay policy. Email us before purchasing if you are applying for a national visa.",
  },
  {
    question: "How much does Germany visa insurance cost?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip, and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to print and submit at VFS Germany the same day.",
  },
  {
    question: "Do I need insurance before booking my flights to Germany?",
    answer:
      "You need it before your VFS appointment, not before booking. Many applicants get the insurance and a flight reservation in the same go so the whole file is ready for one appointment.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for Germany Visa | From AED 30 | Travl",
    description:
      "Get embassy-compliant Germany visa travel insurance online. EUR 30,000 medical coverage across the Schengen Area, accepted by VFS Global Germany. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/germany-visa",
  },
  sections: {
    hero: {
      title: "Germany Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · VFS Global Germany Accepted",
      text: "Get a Germany visa-ready travel insurance policy online instantly. EUR 30,000 medical coverage across the entire Schengen Area, written the way the German consulate expects to see it. Plans from AED 30.",
      pills: [
        "EUR 30,000 Coverage",
        "VFS Global Germany Accepted",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for a Germany Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We help UAE residents put together the paperwork for Germany short-stay visa applications. Every travel insurance policy includes the mandatory EUR 30,000 medical coverage across the Schengen Area, is underwritten by AXA, and is accepted by VFS Global Germany in Dubai and Abu Dhabi. Buy online, get the certificate by email, submit the same day.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Germany Visa Travel Insurance",
          description:
            "Embassy-compliant travel insurance for Germany visa applications. EUR 30,000 medical coverage across the Schengen Area, issued by AXA, delivered instantly to your email.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for Germany Visa",
          description:
            "A verified flight reservation with a real PNR code, the proof of onward travel VFS Germany expects alongside your insurance. From USD 13 via Dummy Ticket 365.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Proof of accommodation in Germany is part of a complete visa file. We provide hotel reservations by email, formatted the way the consulate expects.",
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
      name: pageData.meta.title,
      description: pageData.meta.description,
      areaServed: "AE",
    }),
    buildProduct({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      price: "30.00",
      currency: "AED",
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: "Germany Visa Travel Insurance FAQ",
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
        text={pageData.sections.hero.text}
        pills={pageData.sections.hero.pills}
        breadcrumbPaths={[
          { label: "Home", path: "/" },
          { label: "Travel Insurance", path: "/travel-insurance" },
          { label: "Germany Visa", path: "/travel-insurance/germany-visa" },
        ]}
      />
      <HowItWorks
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={pageData.sections.process.steps}
      />
      <About
        title={pageData.sections.about.title}
        text={pageData.sections.about.text}
        services={pageData.sections.about.services}
      />
      <Benefits
        title="Why UAE Residents Choose Us for Germany Visa Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their Germany visa application"
        testimonials={testimonials}
      />
      <Faqs
        title="Germany Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about Germany visa insurance for UAE residents"
        faqs={faqs}
      />
      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <SectionTitle textAlign="center" className="mb-6">
            Other Travel Insurance Plans
          </SectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "Schengen Visa Insurance", href: "/travel-insurance/schengen-visa" },
              { name: "France Visa Insurance", href: "/travel-insurance/france-visa" },
              { name: "Spain Visa Insurance", href: "/travel-insurance/spain-visa" },
              { name: "Italy Visa Insurance", href: "/travel-insurance/italy-visa" },
              { name: "Greece Visa Insurance", href: "/travel-insurance/greece-visa" },
              { name: "All Travel Insurance Plans", href: "/travel-insurance" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 text-[14px] font-medium hover:bg-primary-100 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
