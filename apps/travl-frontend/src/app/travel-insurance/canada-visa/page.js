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
    text: "Pick your dates for Canada, choose Canada as destination, and add each traveler. The form is set up for the medical cover most Canadian Visitor Visa (TRV) applicants want for the file.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's name and passport details exactly as they appear on the passport. VFS Canada in Dubai and Abu Dhabi will flag any mismatch between your certificate and your TRV application.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your Canada-ready AXA certificate arrives by email within minutes. Print it and bring it to your VFS Canada biometrics appointment the same day.",
  },
];

const testimonials = [
  {
    quote:
      "Applied for a TRV to visit my brother in Toronto. Travl had the AXA certificate emailed in under fifteen minutes, properly formatted, and VFS Canada in Dubai took it without any back and forth.",
    name: "Sana M.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Canada Visa Insurance",
  },
  {
    quote:
      "Two-week trip to Vancouver and Banff. The policy showed clean CAD-level medical cover and exact trip dates. IRCC approved the visa in twelve days.",
    name: "Karan D.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Canada Visa Insurance",
  },
  {
    quote:
      "Canadian winters and emergency rooms aren't cheap, so I wanted real medical cover and not just a piece of paper. Travl gave me both for our family visit in December.",
    name: "Layla J.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Canada Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Built for the Canada Visitor Visa (TRV)",
    text: "Coverage and certificate wording aligned with what IRCC officers and VFS Canada expect to see on a Temporary Resident Visa application from the UAE.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "A genuine AXA travel medical policy. Useful for your Canada visa file and essential during your trip — provincial health plans don't cover visitors.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate arrives by email within minutes of payment. Submit at VFS Canada the same day with no extra trips.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency treatment, hospitalization, repatriation, baggage, trip cancellation, and travel delays are all included.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "Canada visa travel insurance plans sized for typical visitor needs, without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to Canada once, or traveling internationally several times a year? Pick the plan that fits how often you travel.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for a Canada visa?",
    answer:
      "For a standard Visitor Visa (TRV), travel insurance is not mandatory under IRCC rules — but it is strongly recommended. Canadian healthcare is free for residents only; emergency care for visitors can be very expensive. A well-prepared file with insurance also reads more credibly to a visa officer.",
  },
  {
    question: "Does this work for the Canada Super Visa?",
    answer:
      "No. The Super Visa (for parents and grandparents) has its own mandatory insurance requirement: at least CAD 100,000 in medical cover for one year, issued by a Canadian insurer or a Canadian insurer-approved partner. This product is for short-stay Visitor Visa (TRV) trips. Email us for a Super Visa quote separately.",
  },
  {
    question: "How much medical coverage should a Canada visitor policy include?",
    answer:
      "There's no official minimum for a standard TRV, but CAD 100,000 in medical cover is the sensible benchmark — it mirrors the Super Visa requirement and comfortably covers a serious emergency.",
  },
  {
    question: "Is this insurance accepted by VFS Global Canada in the UAE?",
    answer:
      "Yes. Canada visa applications in the UAE go through VFS Global Canada in Dubai and Abu Dhabi. Our AXA certificates are formatted to be acceptable at those centers and to be read clearly by IRCC officers.",
  },
  {
    question: "Does this work for tourist, business, and family visit TRVs?",
    answer:
      "Yes. The same travel medical cover applies for tourism, business meetings, or visiting family on a Temporary Resident Visa.",
  },
  {
    question: "How much does Canada visa travel insurance cost for UAE residents?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip, and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to print and submit at VFS Canada the same day.",
  },
  {
    question: "Do I need insurance before booking my flights to Canada?",
    answer:
      "You need it before your VFS appointment, not before booking. Many applicants get the insurance and a flight reservation together so the full file is ready for one biometrics visit.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for Canada Visa | From AED 30 | Travl",
    description:
      "Get a Canada visa-ready travel insurance policy online. Real AXA medical cover for the Visitor Visa (TRV), accepted by VFS Canada. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/canada-visa",
  },
  sections: {
    hero: {
      title: "Canada Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · VFS Global Canada Accepted",
      text: "Get a Canada Visitor Visa-ready travel insurance policy online instantly. Real AXA medical cover, formatted for IRCC officers and VFS Canada in the UAE. Plans from AED 30.",
      pills: [
        "Visitor Visa (TRV)",
        "VFS Global Canada Accepted",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for a Canada Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We provide Canada travel insurance designed for UAE residents applying for the Visitor Visa (TRV). Policies are issued by AXA, formatted to be read clearly by IRCC officers, and accepted at VFS Global Canada centers in Dubai and Abu Dhabi. Buy your policy online, receive it instantly, and submit your visa application with confidence.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Canada Travel Insurance",
          description:
            "AXA-issued travel medical insurance tailored to the Canada Visitor Visa. Delivered to your inbox within minutes of payment.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for Canada Visa",
          description:
            "Verifiable flight itinerary with a real PNR — the onward travel proof IRCC expects alongside your insurance. From AED 49.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Proof of accommodation is part of a strong Canada visa file. We issue hotel reservations by email, formatted to officer-friendly standards.",
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
      title: "Canada Visa Travel Insurance FAQ",
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
          { label: "Canada Visa", path: "/travel-insurance/canada-visa" },
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
        title="Why UAE Residents Choose Us for Canada Visa Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their Canada visa insurance"
        testimonials={testimonials}
      />
      <Faqs
        title="Canada Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about Canada visa travel insurance for UAE residents"
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
