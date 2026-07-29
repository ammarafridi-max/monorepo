import Link from "next/link";
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineFamilyRestroom,
} from "react-icons/md";
import {
  ShieldCheck,
  FileCheck,
  Zap,
  HeartPulse,
  Banknote,
  Users,
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
    text: "Pick your travel dates, choose your destination region, and add everyone travelling. You get an instant family travel insurance quote with the cover level shown up front.",
  },
  {
    title: "Add Each Traveler",
    text: "Add each family member's name and passport details exactly as they appear on the passport, so your policy certificate matches your travel documents at the airport.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your AXA family travel insurance certificate arrives by email within minutes, covering the whole family from the first day of your trip.",
  },
];

const testimonials = [
  {
    quote:
      "Booked family travel insurance for the four of us before a summer trip to Europe. One policy covered my wife, our two kids and me, and it was cheaper than insuring everyone separately. Certificate came through in minutes.",
    name: "Rashid A.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Family Travel Insurance",
  },
  {
    quote:
      "I needed cheap family travel insurance for a single trip to Turkey and this was exactly that. Real AXA cover, sensible price, and I did not have to fill in the same details five times.",
    name: "Priya S.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Family Travel Insurance Single Trip",
  },
  {
    quote:
      "Sorted travel insurance for the family the night before we flew. One policy for all of us, medical cover included, and the price was hard to beat. The whole thing took about five minutes.",
    name: "Mohammed H.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Family Travel Insurance",
  },
];

const benefits = [
  {
    icon: Users,
    title: "One Policy for the Whole Family",
    text: "Cover everyone travelling under a single family travel insurance policy, from parents to children, without buying a separate plan for each person.",
  },
  {
    icon: Banknote,
    title: "Cheap Family Travel Insurance",
    text: "Insuring the family together usually costs less than separate individual plans, so you get cheap family travel insurance without cutting the cover that matters.",
  },
  {
    icon: FileCheck,
    title: "Real AXA Travel Insurance",
    text: "A genuine AXA travel medical policy, not a placeholder. Valid for real medical emergencies and hospital treatment for every family member during your trip.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Cover",
    text: "Emergency treatment, hospitalization, medical repatriation, baggage, trip cancellation and travel delays are all included for the whole family.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your family travel insurance certificate arrives by email within minutes of payment. Buy it the night before you fly and you are all covered from the moment your trip starts.",
  },
  {
    icon: ShieldCheck,
    title: "Single Trip or Annual Cover",
    text: "Choose a family travel insurance single trip plan for one holiday, or an annual multi-trip policy if the family travels more than once a year.",
  },
];

export const faqs = [
  {
    question: "What is family travel insurance?",
    answer:
      "Family travel insurance is a single policy that covers everyone travelling together, usually two adults and their children, under one certificate. Instead of buying a separate plan for each person, one family travel insurance policy protects the whole group for medical emergencies, hospital care, baggage and trip disruption.",
  },
  {
    question: "Is family travel insurance cheaper than individual plans?",
    answer:
      "In most cases, yes. Insuring everyone together is usually cheaper than buying a separate policy for each traveler, which is why cheap family travel insurance is popular with UAE families. You get the same AXA-backed cover for each person, on one certificate, at a lower combined price.",
  },
  {
    question: "Who can be included on a family travel insurance policy?",
    answer:
      "A family travel insurance policy typically covers parents and their children travelling together. Add each family member when you get your quote and everyone appears on the same certificate. If you are unsure whether your group qualifies as a family, email us before you buy.",
  },
  {
    question: "Can I get family travel insurance for a single trip?",
    answer:
      "Yes. A family travel insurance single trip plan covers one holiday from your departure date to your return, for the whole family, and you only pay for the days you travel. If the family travels more than once a year, an annual multi-trip plan can work out better value.",
  },
  {
    question: "What does family travel insurance cover?",
    answer:
      "An AXA family travel insurance policy covers emergency medical treatment, hospitalization, medical repatriation, personal baggage, trip cancellation and travel delays for every family member listed. The exact cover level is stated clearly on your certificate.",
  },
  {
    question: "Does family travel insurance cover children's medical costs?",
    answer:
      "Yes. Each child listed on the policy is covered for emergency medical treatment and hospital care up to the limit on your certificate, the same as the adults on the plan.",
  },
  {
    question: "Is travel insurance for a family accepted for visa applications?",
    answer:
      "Our Schengen and other visa plans meet embassy cover requirements. If you need travel insurance for a family visa application, choose the relevant country plan or contact us and we will point you to the right cover for your appointment.",
  },
  {
    question: "How much does family travel insurance cost?",
    answer:
      "Plans start from AED 30 per person, and insuring the family together usually brings the combined price down. The exact cost depends on your travel dates, length of trip and the number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive the policy?",
    answer:
      "Within minutes of payment. Your AXA family travel insurance certificate arrives by email, ready to save to your phone before you fly.",
  },
];

export const pageData = {
  meta: {
    title: "Family Travel Insurance | Cheap Cover From AED 30 | Travl",
    description:
      "Family travel insurance for UAE residents. One AXA-backed policy covering the whole family for medical, baggage and trip cover. Cheap family travel insurance, single trip or annual, from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/family",
  },
  sections: {
    hero: {
      title: "Family Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · AXA-Backed · One Policy for Everyone",
      text: "Get family travel insurance in minutes. One AXA-backed policy covers the whole family for emergency medical care, hospital treatment, baggage and trip disruption, delivered by email the moment you pay. Cheap family travel insurance, single trip or annual, from AED 30.",
      pills: [
        "AXA-Backed Cover",
        "Whole Family, One Policy",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Family Travel Insurance",
      subtitle: "Cover the whole family in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We help UAE families get ready to travel with confidence. Every family travel insurance policy is underwritten by AXA and covers emergency medical care, hospital treatment, baggage and trip disruption for each family member. Buy online, get one certificate by email for everyone, and travel with real cover behind you.",
      services: [
        {
          icon: <MdOutlineFamilyRestroom />,
          title: "Family Travel Insurance",
          description:
            "One AXA-backed policy covering the whole family. Emergency medical, hospitalization, repatriation, baggage and trip cover for every traveler, delivered instantly to your email.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Medical Cover",
          description:
            "Emergency treatment and hospitalization cover for every family member, up to the limit shown clearly on your certificate.",
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
      title: "Family Travel Insurance FAQ",
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
          { label: "Family", path: "/travel-insurance/family" },
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
        title="Why UAE Families Choose Us for Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE families who insured their trips with Travl"
        testimonials={testimonials}
      />
      <Faqs
        title="Family Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about family travel insurance for UAE residents"
        faqs={faqs}
      />
      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <SectionTitle textAlign="center" className="mb-6">
            Other Travel Insurance Plans
          </SectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "Single Trip Insurance", href: "/travel-insurance/single-trip" },
              { name: "Annual Multi-Trip Insurance", href: "/travel-insurance/annual-multi-trip" },
              { name: "International Travel Insurance", href: "/travel-insurance/international" },
              { name: "Medical Travel Insurance", href: "/travel-insurance/medical" },
              { name: "Schengen Visa Insurance", href: "/travel-insurance/schengen-visa" },
              { name: "Indonesia Travel Insurance", href: "/travel-insurance/indonesia" },
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
