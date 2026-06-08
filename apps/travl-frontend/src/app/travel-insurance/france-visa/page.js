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
    text: "Pick your travel dates to France, choose Europe as the destination region, and add each traveler. The form is set up to meet the insurance requirements the French consulate looks for.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's details exactly as printed on the passport. The names on your insurance certificate must match your visa application or VFS Global France will flag it.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay securely online and your France-ready travel insurance certificate arrives by email within minutes. Print it and add it to your VFS Global France submission the same day.",
  },
];

const testimonials = [
  {
    quote:
      "Applied for a Paris trip with about ten days before my VFS appointment. Got the AXA certificate the same day I paid and the French consulate didn't even question it.",
    name: "Hassan B.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "France Visa Insurance",
  },
  {
    quote:
      "The agent at VFS Wafi checked the EUR 30,000 cover and the Schengen wording, ticked the box and moved on. Whole submission took under fifteen minutes.",
    name: "Lina F.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "France Visa Insurance",
  },
  {
    quote:
      "Was nervous because my friend got rejected over insurance last year. Travl's policy listed France and all the Schengen countries clearly, and my visa came back in eight working days.",
    name: "Rohan T.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "France Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Meets the French Consulate's Requirements",
    text: "Every policy includes the mandatory EUR 30,000 medical coverage across the entire Schengen Area, including France, which is what the French consulate and VFS Global France check for.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "This is a genuine travel medical insurance policy issued by a licensed insurer. It is valid both for your France visa application and for actual medical emergencies during your trip.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate is in your inbox within minutes of payment. Submit your France visa application at VFS the same day with no extra trips or follow-up.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency medical treatment, hospitalization, repatriation, baggage loss, travel delays, and trip cancellations are all included.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "Cost-effective France visa insurance plans that meet the consulate's requirements without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to France once, or visiting Europe multiple times this year? Pick a single-trip plan for one visa application or an annual multi-trip plan if you travel often.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for a France visa?",
    answer:
      "Yes. Travel insurance is a mandatory requirement for any France short-stay (Type C / Schengen) visa application. The French consulate requires a policy with at least EUR 30,000 in medical coverage, valid throughout the Schengen Area for the full duration of your trip.",
  },
  {
    question: "What does the French consulate need to see on the certificate?",
    answer:
      "Three things: a minimum of EUR 30,000 (or its equivalent) in medical coverage, validity across the entire Schengen Area (not just France), and dates covering your full intended stay. Our certificates are written to spell out all three.",
  },
  {
    question: "Is this insurance accepted by VFS Global France?",
    answer:
      "Yes. Policies issued through this page are accepted by VFS Global France at the Wafi Mall and Abu Dhabi visa application centers. The certificate format meets what the agents and the French consulate look for.",
  },
  {
    question: "Will this work for a business or family visa to France?",
    answer:
      "Yes. The insurance requirement is the same across all France short-stay visa categories — tourism, business, family visit, or visiting a friend. The same EUR 30,000 Schengen cover applies.",
  },
  {
    question: "Does this cover a French long-stay (Type D) visa?",
    answer:
      "Long-stay visas to France (Type D, for study, work, or family reunification of more than 90 days) usually require a specific long-stay insurance product, not a standard Schengen policy. Email us before purchasing if you are applying for a long-stay visa and we will let you know the right option.",
  },
  {
    question: "How much does France visa insurance cost for UAE residents?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, the duration of your trip, and the number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to print and submit at VFS Global France the same day.",
  },
  {
    question: "Do I need insurance before booking my flights to France?",
    answer:
      "You need insurance before you submit your France visa application, not necessarily before booking. Many applicants get the insurance and a flight reservation at the same time, so they have everything ready for the VFS appointment.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for France Visa | From AED 30 | Travl",
    description:
      "Get embassy-compliant France visa travel insurance online. EUR 30,000 medical coverage across the Schengen Area, accepted by VFS Global France. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/france-visa",
  },
  sections: {
    hero: {
      title: "France Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · VFS Global France Accepted",
      text: "Get a France visa-ready travel insurance policy online instantly. EUR 30,000 medical coverage across the entire Schengen Area, written the way the French consulate wants to see it. Plans from AED 30.",
      pills: [
        "EUR 30,000 Coverage",
        "VFS Global France Accepted",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for a France Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We help UAE residents put together the paperwork needed for France short-stay visa applications. Every travel insurance policy we issue includes the mandatory EUR 30,000 medical coverage across the Schengen Area, is underwritten by AXA, and is accepted by VFS Global France at the Wafi Mall and Abu Dhabi visa application centers. Buy it online, get the certificate by email, and submit your application the same day.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "France Visa Travel Insurance",
          description:
            "Embassy-compliant travel insurance for France visa applications. EUR 30,000 medical coverage across the Schengen Area, issued by AXA, and delivered instantly to your email.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for France Visa",
          description:
            "A verifiable flight itinerary with a real PNR code — the proof of onward travel France visa applicants need alongside insurance. From AED 49.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Proof of accommodation in France is part of a complete visa file. We provide hotel reservations by email, formatted to meet what the consulate expects.",
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
      title: "France Visa Travel Insurance FAQ",
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
          { label: "France Visa", path: "/travel-insurance/france-visa" },
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
        title="Why UAE Residents Choose Us for France Visa Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their France visa application"
        testimonials={testimonials}
      />
      <Faqs
        title="France Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about France visa insurance for UAE residents"
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
