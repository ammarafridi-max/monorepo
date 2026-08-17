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
import { DUMMY_TICKET_365 } from '@/config/partners';

export const processSteps = [
  {
    title: "Enter Your Trip Details",
    text: "Choose your travel dates for the Netherlands, pick Europe as the destination, and add each traveler. The form is set up for the cover the Dutch consulate asks for.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's name and passport details exactly as on the passport. VFS Netherlands checks the certificate against your application, so a typo is an easy way to slow things down.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your Netherlands-ready AXA certificate arrives by email within minutes. Print it and bring it to your VFS Netherlands appointment the same day.",
  },
];

const testimonials = [
  {
    quote:
      "Amsterdam trip in tulip season, appointments were tight. Having the insurance certificate ready the same evening meant I grabbed the first VFS slot I could. Approved in ten days.",
    name: "Bilal S.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Netherlands Visa Insurance",
  },
  {
    quote:
      "The AXA certificate clearly showed EUR 30,000 and the full Schengen Area. VFS Netherlands checked it, matched the dates to my trip, and that was it.",
    name: "Sofia D.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Netherlands Visa Insurance",
  },
  {
    quote:
      "Family visit to Rotterdam, three of us. All three certificates downloaded in minutes with every name matching the passports. The Dutch visas came back together.",
    name: "Imran Q.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Netherlands Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Meets Dutch Consulate Requirements",
    text: "EUR 30,000 medical coverage across the entire Schengen Area, including the Netherlands, written exactly the way the Dutch consulate and VFS Netherlands expect.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "A genuine AXA travel medical policy. Valid for your Netherlands visa submission and for real medical emergencies during your trip.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate arrives by email within minutes of payment. Submit at VFS Netherlands the same day with no waiting.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency treatment, hospitalization, repatriation, baggage, trip cancellation, and travel delays are all included.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "Netherlands visa insurance plans that meet the consulate's requirements without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to the Netherlands once, or to Europe regularly? Single-trip or annual multi-trip plans are both available.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for a Netherlands visa?",
    answer:
      "Yes. The Dutch consulate requires travel insurance for every Schengen short-stay (Type C) visa application. The policy must include at least EUR 30,000 in medical coverage, be valid throughout the Schengen Area, and cover the full duration of your trip.",
  },
  {
    question: "Is this insurance accepted by VFS Global Netherlands?",
    answer:
      "Yes. Netherlands visa applications in the UAE go through VFS Global in Dubai and Abu Dhabi. Our certificates are formatted exactly the way VFS Netherlands and the Dutch consulate expect.",
  },
  {
    question: "What needs to be on the certificate for a Netherlands visa?",
    answer:
      "Three things: at least EUR 30,000 in medical cover with the figure stated clearly, validity across the entire Schengen Area not just the Netherlands, and dates that cover your full stay including arrival and departure days.",
  },
  {
    question: "Do I need a visa if I am only transiting through Amsterdam Schiphol?",
    answer:
      "If you stay airside and do not pass through immigration, a short layover at Schiphol usually does not need a Schengen visa. The moment you plan to leave the airport or enter the Netherlands, you need a short-stay visa and the EUR 30,000 insurance that goes with it.",
  },
  {
    question: "Does this work for tourist, business, and family visit visas?",
    answer:
      "Yes. The same EUR 30,000 Schengen cover applies across all Netherlands short-stay visa categories — tourism, business, family visit, or visiting friends.",
  },
  {
    question: "Does this cover a Dutch long-stay (MVV) visa?",
    answer:
      "The Dutch MVV and other long-stay visas — for study, work, or stays over 90 days — usually require a specific long-stay insurance product, not a Schengen short-stay policy. Email us before purchasing if you are applying for an MVV and we will point you to the right option.",
  },
  {
    question: "How much does Netherlands visa insurance cost?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip, and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to print and submit at VFS Netherlands the same day.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for Netherlands Visa | From AED 30 | Travl",
    description:
      "Get embassy-compliant Netherlands visa travel insurance online. EUR 30,000 medical coverage across the Schengen Area, accepted by VFS Global Netherlands. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/netherlands-visa",
  },
  sections: {
    hero: {
      title: "Netherlands Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · VFS Global Netherlands Accepted",
      text: "Get a Netherlands visa-ready travel insurance policy online instantly. EUR 30,000 medical coverage across the entire Schengen Area, written the way the Dutch consulate expects to see it. Plans from AED 30.",
      pills: [
        "EUR 30,000 Coverage",
        "VFS Global Netherlands Accepted",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for a Netherlands Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We help UAE residents put together the paperwork for Netherlands short-stay visa applications. Every travel insurance policy includes the mandatory EUR 30,000 medical coverage across the Schengen Area, is underwritten by AXA, and is accepted by VFS Global Netherlands in Dubai and Abu Dhabi. Buy online, get the certificate by email, submit the same day.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Netherlands Visa Travel Insurance",
          description:
            "Embassy-compliant travel insurance for Netherlands visa applications. EUR 30,000 medical coverage across the Schengen Area, issued by AXA, delivered instantly to your email.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for Netherlands Visa",
          description:
            `A verified flight reservation with a real PNR code, the proof of onward travel VFS Netherlands expects alongside your insurance. From USD 13 via ${DUMMY_TICKET_365.name}.`,
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            `Proof of accommodation in the Netherlands is part of a complete visa file. ${DUMMY_TICKET_365.name} issues these hotel reservations by email, formatted the way the consulate expects.`,
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
      title: "Netherlands Visa Travel Insurance FAQ",
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
          { label: "Netherlands Visa", path: "/travel-insurance/netherlands-visa" },
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
        title="Why UAE Residents Choose Us for Netherlands Visa Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their Netherlands visa application"
        testimonials={testimonials}
      />
      <Faqs
        title="Netherlands Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about Netherlands visa insurance for UAE residents"
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
              { name: "Germany Visa Insurance", href: "/travel-insurance/germany-visa" },
              { name: "Italy Visa Insurance", href: "/travel-insurance/italy-visa" },
              { name: "Greece Visa Insurance", href: "/travel-insurance/greece-visa" },
              { name: "Spain Visa Insurance", href: "/travel-insurance/spain-visa" },
              { name: "Switzerland Visa Insurance", href: "/travel-insurance/switzerland-visa" },
              { name: "Austria Visa Insurance", href: "/travel-insurance/austria-visa" },
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
