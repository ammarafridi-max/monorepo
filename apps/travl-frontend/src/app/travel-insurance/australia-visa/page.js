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
    text: "Pick your dates for Australia, choose Australia as destination, and add each traveler. The form is set up for the medical cover most Visitor visa (subclass 600) applicants want for the file.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's name and passport details exactly as they appear on the passport. Home Affairs will compare your file against your ImmiAccount application.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your Australia-ready AXA certificate arrives by email within minutes. Attach it to your ImmiAccount file or save it for the trip — Medicare doesn't cover visitors.",
  },
];

const testimonials = [
  {
    quote:
      "Applied for a subclass 600 to visit my sister in Sydney. Travl had the AXA certificate emailed in about ten minutes — solid medical cover and clean formatting. Uploaded it straight to ImmiAccount with the rest of my file.",
    name: "Faisal H.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Australia Visa Insurance",
  },
  {
    quote:
      "Two-week trip to Melbourne and the Great Ocean Road. Medicare doesn't cover tourists so I wanted real medical cover, not just paperwork. The policy from Travl was exactly that.",
    name: "Nikita P.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Australia Visa Insurance",
  },
  {
    quote:
      "Visa officer didn't ask about insurance directly, but having it in the file alongside flights and hotels made everything look prepared. Approved in a week.",
    name: "Yusuf I.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Australia Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Built for the Visitor Visa (Subclass 600)",
    text: "Coverage and certificate wording aligned with what Home Affairs officers expect to see on a Visitor visa file from the UAE.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "A genuine AXA travel medical policy. Useful for your Australia visa file and essential for your trip — Medicare doesn't cover non-residents.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate arrives by email within minutes of payment. Upload it to ImmiAccount or save it for your trip the same day.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency treatment, hospitalization, repatriation, baggage, trip cancellation, and travel delays are all included.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "Australia visa travel insurance plans sized for typical visitor needs, without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to Australia once, or traveling internationally several times a year? Pick the plan that fits how often you travel.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for an Australia visa?",
    answer:
      "For most Visitor visa (subclass 600) streams, travel insurance is not strictly mandatory under Home Affairs rules — but it is strongly recommended. Medicare does not cover non-residents, and treatment costs are paid privately. A well-prepared file with insurance also reads more credibly to a visa officer.",
  },
  {
    question: "Does this work for the subclass 600 Sponsored Family stream?",
    answer:
      "Yes for the insurance itself. The Sponsored Family stream sometimes also requires a security bond — that's a separate financial requirement Home Affairs would request directly, not something insurance replaces.",
  },
  {
    question: "How much medical coverage should an Australia visitor policy include?",
    answer:
      "There's no official minimum, but at least AUD 100,000 in medical cover is the sensible benchmark — emergency treatment for visitors in Australia is billed privately and can run high quickly.",
  },
  {
    question: "Does this work for tourist, business, and family visit Visitor visas?",
    answer:
      "Yes. The same travel medical cover applies across all Visitor visa (subclass 600) streams — tourism, business, family visit, or visiting a friend.",
  },
  {
    question: "Does this cover work, study, or working holiday visas?",
    answer:
      "No. Subclasses like 417/462 (Working Holiday), 482 (work), or 500 (student) usually require specific insurance products such as OVHC. This product is for short-stay Visitor visa trips. Email us before purchasing if you are applying for one of these.",
  },
  {
    question: "How much does Australia travel insurance cost for UAE residents?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip, and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to upload to ImmiAccount or save for the trip.",
  },
  {
    question: "Do I need insurance before booking my flights to Australia?",
    answer:
      "No, you can purchase it any time before you travel. Most people get insurance, a flight reservation, and hotel bookings together when assembling the visa file.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for Australia Visa | From AED 30 | Travl",
    description:
      "Get travel insurance for your Australia Visitor visa (subclass 600). Real AXA medical cover for trips Medicare won't cover. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/australia-visa",
  },
  sections: {
    hero: {
      title: "Australia Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · For the Visitor Visa (Subclass 600)",
      text: "Get an Australia Visitor visa-ready travel insurance policy online instantly. Real AXA medical cover for trips Medicare doesn't cover, formatted to slot neatly into your ImmiAccount file. Plans from AED 30.",
      pills: [
        "Visitor Visa (Subclass 600)",
        "Medicare Doesn't Cover Visitors",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for an Australia Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We provide Australia travel insurance designed for UAE residents applying for the Visitor visa (subclass 600). Policies are issued by AXA, formatted to attach cleanly to an ImmiAccount file, and delivered to your inbox in minutes. Useful at the visa stage as a sign of a well-prepared file, and essential for your protection once you land — Medicare does not cover non-residents.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Australia Travel Insurance",
          description:
            "AXA-issued travel medical insurance tailored to the Australia Visitor visa. Delivered to your inbox within minutes of payment.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for Australia Visa",
          description:
            "Verifiable flight itinerary with a real PNR — onward travel proof that pairs naturally with your insurance in the visa file. From AED 49.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Hotel reservations by email, formatted to officer-friendly standards — useful for showing planned accommodation in your Australia visa file.",
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
      title: "Australia Visa Travel Insurance FAQ",
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
          { label: "Australia Visa", path: "/travel-insurance/australia-visa" },
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
        title="Why UAE Residents Choose Us for Australia Visa Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their Australia visa insurance"
        testimonials={testimonials}
      />
      <Faqs
        title="Australia Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about Australia visa travel insurance for UAE residents"
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
