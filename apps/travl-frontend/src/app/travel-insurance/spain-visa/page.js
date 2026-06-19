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
    text: "Choose your travel dates for Spain, pick Europe as the destination, and add each traveler. The form is configured for the cover the Spanish consulate requires.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Type each traveler's details exactly as they appear on the passport. BLS International Spain will reject a certificate where the names do not match the application.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your Spain-ready AXA certificate is in your inbox in minutes. Print it and take it to your BLS Spain appointment the same day.",
  },
];

const testimonials = [
  {
    quote:
      "Applied for a Madrid trip and was running tight on time. The AXA certificate came through within fifteen minutes and BLS Spain in Dubai accepted it without a second glance.",
    name: "Salem A.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Spain Visa Insurance",
  },
  {
    quote:
      "Went in for Barcelona thinking the insurance would be the hard part. The BLS officer checked the EUR 30,000 cover, saw Spain listed in the Schengen Area, and stamped it.",
    name: "Reem H.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Spain Visa Insurance",
  },
  {
    quote:
      "I needed two policies for a family trip. Both arrived within minutes of payment with everyone's names spelled exactly right. Spanish visas approved in two weeks.",
    name: "Vikram S.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Spain Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Meets Spanish Consulate Requirements",
    text: "EUR 30,000 medical coverage across the full Schengen Area, including Spain, written exactly the way BLS Spain and the Spanish consulate expect.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "A genuine, AXA-issued travel medical policy. It is valid for your Spain visa submission and for actual medical emergencies during your trip.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate is in your inbox within minutes of payment. Submit at BLS Spain the same day with no waiting.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency medical treatment, hospitalization, repatriation, baggage loss, trip cancellation, and travel delays are all covered.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "Spain visa insurance plans that meet BLS and consulate requirements without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to Spain once, or to Europe several times this year? Pick a single-trip policy or an annual multi-trip plan to fit how often you travel.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for a Spain visa?",
    answer:
      "Yes. The Spanish consulate requires travel insurance for every Schengen short-stay (Type C) visa application. The policy must include a minimum of EUR 30,000 in medical coverage, be valid throughout the Schengen Area, and cover your full intended stay.",
  },
  {
    question: "Is this insurance accepted by BLS International Spain?",
    answer:
      "Yes. Spain visa applications in the UAE go through BLS International (not VFS Global), and our certificates are formatted exactly the way BLS Spain in Dubai and Abu Dhabi expects to see them.",
  },
  {
    question: "What needs to be on the certificate for a Spain visa?",
    answer:
      "Three things: at least EUR 30,000 in medical cover (the consulate often looks for the exact figure spelled out), validity across the entire Schengen Area not just Spain, and dates that cover your full intended stay including arrival and departure days.",
  },
  {
    question: "Does this work for tourist, business, and family visit visas?",
    answer:
      "Yes. The insurance requirement is identical across all Spain short-stay visa categories — tourism, business, family visit, or visiting a friend. The same EUR 30,000 Schengen cover applies to all of them.",
  },
  {
    question: "Does this cover a Spanish long-stay (Type D) visa?",
    answer:
      "Spanish long-stay visas — for study, work, or family reunification of more than 90 days — usually require a specific long-stay insurance product, not a Schengen short-stay policy. Email us before purchasing if you are applying for a long-stay visa and we will let you know the right option.",
  },
  {
    question: "How much does Spain visa insurance cost?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip, and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to print and submit at BLS Spain the same day.",
  },
  {
    question: "Do I need insurance before booking my flights to Spain?",
    answer:
      "You need it before your BLS appointment, not before booking flights. Most applicants buy insurance and a flight reservation at the same time so the whole file is ready for one appointment.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for Spain Visa | From AED 30 | Travl",
    description:
      "Get embassy-compliant Spain visa travel insurance online. EUR 30,000 medical coverage across the Schengen Area, accepted by BLS International Spain. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/spain-visa",
  },
  sections: {
    hero: {
      title: "Spain Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · BLS Spain Accepted",
      text: "Get a Spain visa-ready travel insurance policy online instantly. EUR 30,000 medical coverage across the entire Schengen Area, written the way BLS International Spain and the Spanish consulate expect. Plans from AED 30.",
      pills: [
        "EUR 30,000 Coverage",
        "BLS Spain Accepted",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for a Spain Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We help UAE residents put together the paperwork for Spain short-stay visa applications. Every travel insurance policy includes the mandatory EUR 30,000 medical coverage across the Schengen Area, is underwritten by AXA, and is accepted by BLS International Spain in Dubai and Abu Dhabi. Buy online, get the certificate by email, and submit your application the same day.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Spain Visa Travel Insurance",
          description:
            "Embassy-compliant travel insurance for Spain visa applications. EUR 30,000 medical coverage across the Schengen Area, issued by AXA, delivered instantly to your email.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for Spain Visa",
          description:
            "A verified flight reservation with a real PNR code, the proof of onward travel BLS Spain expects alongside your insurance. From USD 13 via Dummy Ticket 365.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Proof of accommodation in Spain is part of a complete visa file. We provide hotel reservations by email, formatted the way the consulate expects.",
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
      title: "Spain Visa Travel Insurance FAQ",
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
          { label: "Spain Visa", path: "/travel-insurance/spain-visa" },
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
        title="Why UAE Residents Choose Us for Spain Visa Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their Spain visa application"
        testimonials={testimonials}
      />
      <Faqs
        title="Spain Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about Spain visa insurance for UAE residents"
        faqs={faqs}
      />
      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <SectionTitle textAlign="center" className="mb-6">
            Other Travel Insurance Plans
          </SectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              {
                name: "Schengen Visa Insurance",
                href: "/travel-insurance/schengen-visa",
              },
              {
                name: "France Visa Insurance",
                href: "/travel-insurance/france-visa",
              },
              {
                name: "Italy Visa Insurance",
                href: "/travel-insurance/italy-visa",
              },
              {
                name: "Germany Visa Insurance",
                href: "/travel-insurance/germany-visa",
              },
              {
                name: "Greece Visa Insurance",
                href: "/travel-insurance/greece-visa",
              },
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
