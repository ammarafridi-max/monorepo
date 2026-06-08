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
    text: "Select your travel dates, destination region, and number of travelers. The form automatically adjusts to Schengen visa insurance requirements.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's details exactly as shown on their passport. This ensures your policy is issued correctly and accepted by the embassy without delays.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Complete payment securely and receive your Schengen-compliant travel insurance certificate by email within minutes, ready for your visa submission.",
  },
];

const testimonials = [
  {
    quote:
      "Booked my Schengen appointment with a week to spare and panicked about insurance. Got the AXA policy by email in about ten minutes and the German consulate took it without asking a thing.",
    name: "Ahmed K.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Schengen Insurance",
  },
  {
    quote:
      "I'd read horror stories about people getting rejected over insurance that didn't hit the EUR 30,000 cover. This one did, all 27 countries listed, and my French visa came back approved first try.",
    name: "Priya N.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Schengen Insurance",
  },
  {
    quote:
      "VFS for Italy can be picky. I printed the AXA certificate Travl emailed me, the counter staff stamped it and moved on. Honestly relieved.",
    name: "Maria C.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Schengen Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Embassy-Compliant Schengen Insurance",
    text: "Every policy meets official Schengen visa requirements, including the mandatory EUR 30,000 medical coverage valid across all 27 Schengen countries.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "This is a genuine travel medical insurance policy issued by a licensed insurer — valid for your visa application and for actual medical emergencies during your trip.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Receive your travel insurance certificate by email immediately after payment. No waiting, no follow-up needed — submit your Schengen visa application the same day.",
  },
  {
    icon: HeartPulse,
    title: "Comprehensive Medical and Travel Coverage",
    text: "Coverage includes emergency medical treatment, hospitalization, repatriation, travel delays, baggage loss, and trip cancellations.",
  },
  {
    icon: Banknote,
    title: "Affordable Plans for Every Budget",
    text: "Compare cost-effective Schengen insurance plans starting from AED 30, designed for visa applications without overpaying for unnecessary extras.",
  },
  {
    icon: RefreshCw,
    title: "Single-Trip and Multi-Trip Plans",
    text: "Whether you're applying for one Schengen visa or traveling to Europe multiple times a year, we have a plan that fits.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for a Schengen visa?",
    answer:
      "Yes. Travel insurance is a mandatory requirement for all Schengen visa applications. Your policy must cover at least EUR 30,000 in medical expenses and be valid across all Schengen countries for the full duration of your trip.",
  },
  {
    question: "What coverage is required for Schengen travel insurance?",
    answer:
      "Your Schengen visa insurance must include a minimum of EUR 30,000 in medical coverage, covering emergency treatment, hospitalization, and repatriation to your home country.",
  },
  {
    question: "Is this policy valid across all Schengen countries?",
    answer:
      "Yes. The policy is valid in all 27 Schengen countries and fully meets the visa insurance requirements set by European embassies.",
  },
  {
    question: "How much does Schengen travel insurance cost for UAE residents?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, destination, and number of travelers. You can get a quote instantly on this page.",
  },
  {
    question: "How quickly will I receive my travel insurance policy?",
    answer:
      "Your Schengen travel insurance certificate is delivered to your email immediately after payment is confirmed — usually within minutes.",
  },
  {
    question: "Is this insurance accepted by VFS and BLS?",
    answer:
      "Yes. Policies issued through this page are accepted by VFS Global and BLS International visa centers in the UAE.",
  },
  {
    question: "Do I need travel insurance if I'm only applying for a visa?",
    answer:
      "Yes. Even if you haven't booked your flights yet, you still need travel insurance before submitting your Schengen visa application. Our policies cover the dates you specify.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for Schengen Visa | From AED 30 | Travl",
    description:
      "Get embassy-compliant Schengen travel insurance online. EUR 30,000 medical coverage, accepted by VFS & BLS. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/schengen-visa",
  },
  sections: {
    hero: {
      title: "Schengen Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · VFS & BLS Accepted",
      text: "Get an embassy-compliant Schengen visa travel insurance policy online instantly. EUR 30,000 medical coverage included, accepted by VFS and BLS centers across the UAE. Plans from AED 30.",
      pills: [
        "EUR 30,000 Coverage",
        "VFS & BLS Accepted",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for Schengen Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We provide Schengen travel insurance specifically for UAE residents applying for European Schengen visas. Every policy meets official Schengen visa insurance requirements — including mandatory EUR 30,000 medical coverage — and is accepted by embassies, VFS Global, and BLS International centers. Buy your policy online, receive it instantly, and submit your visa application with confidence.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Schengen Travel Insurance",
          description:
            "Embassy-compliant Schengen travel insurance with the mandatory EUR 30,000 medical coverage. Issued by AXA, accepted by VFS Global and BLS International, and delivered instantly.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for Schengen Visa",
          description:
            "Verifiable flight itinerary with a real PNR code — the proof of onward travel required alongside insurance for a Schengen visa application. From AED 49.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Proof of accommodation is a Schengen visa requirement. We provide hotel reservations by email, formatted to meet embassy and consulate standards.",
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
      title: "Schengen Travel Insurance FAQ",
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
          { label: "Schengen Visa", path: "/travel-insurance/schengen-visa" },
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
        title="Why UAE Residents Choose Us for Schengen Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their Schengen visa insurance"
        testimonials={testimonials}
      />
      <Faqs
        title="Schengen Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about Schengen insurance for UAE residents"
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
                name: "Travel Medical Insurance",
                href: "/travel-insurance/medical",
              },
              {
                name: "Annual Multi-Trip Insurance",
                href: "/travel-insurance/annual-multi-trip",
              },
              {
                name: "International Travel Insurance",
                href: "/travel-insurance/international",
              },
              {
                name: "Single Trip Insurance",
                href: "/travel-insurance/single-trip",
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
