import Link from "next/link";
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineCardTravel,
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
    title: "Enter Your Details",
    text: "Choose annual cover, pick your start date, and add everyone you want on the policy. You get an instant annual travel insurance quote with the cover level shown up front.",
  },
  {
    title: "Add Traveler Details",
    text: "Add each traveler's name and passport details exactly as they appear on the passport, so your policy certificate matches your travel documents at the airport all year.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your AXA annual travel insurance certificate arrives by email within minutes, covering every trip you take for the next 12 months.",
  },
];

const testimonials = [
  {
    quote:
      "I travel for work most months, so annual travel insurance made far more sense than buying a new policy each time. Sorted it once with Travl and I am covered for the whole year. The price beat what my bank quoted.",
    name: "Rashid A.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Annual Travel Insurance",
  },
  {
    quote:
      "We take three or four family holidays a year, so annual holiday insurance was the obvious choice. One policy covers all of it and the certificate came through in minutes. Genuinely cheap annual travel insurance for what you get.",
    name: "Priya S.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Annual Travel Insurance",
  },
  {
    quote:
      "Best annual travel insurance UAE deal I found. Real AXA cover, quick to buy, and I stopped worrying about insurance every time a trip came up. Set it once and forget it.",
    name: "Mohammed H.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Annual Trip Travel Insurance",
  },
];

const benefits = [
  {
    icon: RefreshCw,
    title: "One Policy for a Full Year",
    text: "Annual travel insurance covers every trip you take for 12 months under a single policy, so you never have to buy cover trip by trip again.",
  },
  {
    icon: Banknote,
    title: "Cheap Annual Travel Insurance",
    text: "If you travel more than twice a year, one annual policy usually costs less than several single-trip plans, giving you cheap annual travel insurance without cutting the cover that matters.",
  },
  {
    icon: FileCheck,
    title: "Real AXA Travel Insurance",
    text: "A genuine AXA travel medical policy, not a placeholder. Valid for real medical emergencies and hospital treatment on every trip across the year.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Cover",
    text: "Emergency treatment, hospitalization, medical repatriation, baggage, trip cancellation and travel delays are all included on your annual trip travel insurance.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your annual travel insurance certificate arrives by email within minutes of payment, ready to save to your phone before your next trip.",
  },
  {
    icon: ShieldCheck,
    title: "Cover for Every Destination",
    text: "One annual holiday insurance policy covers your trips worldwide, so you are protected wherever the year takes you.",
  },
];

export const faqs = [
  {
    question: "What is annual travel insurance?",
    answer:
      "Annual travel insurance is a single policy that covers every trip you take over 12 months, instead of buying separate cover for each holiday. One certificate protects you for medical emergencies, hospital care, baggage and trip disruption on all your trips for the year.",
  },
  {
    question: "Is annual travel insurance cheaper than single-trip cover?",
    answer:
      "For frequent travelers, usually yes. If you take more than two or three trips a year, one annual policy typically costs less than buying single-trip cover each time, which is why cheap annual travel insurance is popular with UAE residents who travel often.",
  },
  {
    question: "Who is annual travel insurance UAE cover best for?",
    answer:
      "Annual travel insurance UAE cover suits residents who travel several times a year, whether for work or holidays. If you fly more than twice a year, one annual policy saves you buying and comparing cover before every trip.",
  },
  {
    question: "Does annual holiday insurance cover trips worldwide?",
    answer:
      "Yes. An annual holiday insurance policy covers your trips across the regions shown on your certificate, so you are protected wherever you travel during the year. Check the certificate for the exact regions and cover limits.",
  },
  {
    question: "How long does each trip on an annual policy last?",
    answer:
      "Annual trip travel insurance covers an unlimited number of trips in the year, with each trip up to a maximum length stated on your policy. If you plan a longer stay, check the per-trip limit or email us before you travel.",
  },
  {
    question: "What does annual travel insurance cover?",
    answer:
      "An AXA annual travel insurance policy covers emergency medical treatment, hospitalization, medical repatriation, personal baggage, trip cancellation and travel delays on every trip you take for 12 months. The exact cover level is stated clearly on your certificate.",
  },
  {
    question: "When does my annual travel insurance start?",
    answer:
      "Your cover starts on the policy start date you choose and runs for 12 months. You can set it to begin on the day you buy or on a future date, whichever suits your travel plans.",
  },
  {
    question: "How much does annual travel insurance cost?",
    answer:
      "Prices depend on the regions you want covered and the number of travelers on the policy. For frequent travelers it usually works out cheaper than buying single-trip cover each time. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. Your AXA annual travel insurance certificate arrives by email, ready to save to your phone before your next trip.",
  },
];

export const pageData = {
  meta: {
    title: "Annual Travel Insurance UAE | Cheap Cover | Travl",
    description:
      "Annual travel insurance for UAE residents. One AXA-backed policy covering every trip for 12 months. Cheap annual travel insurance and annual holiday insurance, instant policy by email.",
    canonical: "https://www.travl.ae/travel-insurance/annual",
  },
  sections: {
    hero: {
      title: "Annual Travel Insurance for UAE Residents",
      subtitle: "AXA-Backed · One Policy · Covers Every Trip for 12 Months",
      text: "Get annual travel insurance in minutes. One AXA-backed policy covers every trip you take for a full year, with emergency medical care, hospital treatment, baggage and trip disruption included. Cheap annual travel insurance for UAE residents, delivered by email the moment you pay.",
      pills: [
        "AXA-Backed Cover",
        "Unlimited Trips for 12 Months",
        "Instant Delivery",
        "Annual Travel Insurance UAE",
      ],
    },
    process: {
      title: "How to Get Annual Travel Insurance",
      subtitle: "Cover a full year of trips in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We help UAE residents who travel often stay covered without buying insurance before every trip. Every annual travel insurance policy is underwritten by AXA and covers emergency medical care, hospital treatment, baggage and trip disruption on all your trips for 12 months. Buy online, get your certificate by email, and travel with real cover behind you all year.",
      services: [
        {
          icon: <MdOutlineCardTravel />,
          title: "Annual Travel Insurance",
          description:
            "One AXA-backed policy covering every trip for 12 months. Emergency medical, hospitalization, repatriation, baggage and trip cover, delivered instantly to your email.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Medical Cover",
          description:
            "Emergency treatment and hospitalization cover on every trip across the year, up to the limit shown clearly on your certificate.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Reservation",
          description:
            "A verified flight reservation with a real PNR code, useful as proof of onward travel if immigration asks on arrival.",
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
      title: "Annual Travel Insurance FAQ",
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
          { label: "Annual", path: "/travel-insurance/annual" },
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
        title="Why UAE Residents Choose Us for Annual Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who chose annual travel insurance with Travl"
        testimonials={testimonials}
      />
      <Faqs
        title="Annual Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about annual travel insurance for UAE residents"
        faqs={faqs}
      />
      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <SectionTitle textAlign="center" className="mb-6">
            Other Travel Insurance Plans
          </SectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "Annual Multi-Trip Insurance", href: "/travel-insurance/annual-multi-trip" },
              { name: "Family Travel Insurance", href: "/travel-insurance/family" },
              { name: "Single Trip Insurance", href: "/travel-insurance/single-trip" },
              { name: "International Travel Insurance", href: "/travel-insurance/international" },
              { name: "Medical Travel Insurance", href: "/travel-insurance/medical" },
              { name: "Schengen Visa Insurance", href: "/travel-insurance/schengen-visa" },
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
