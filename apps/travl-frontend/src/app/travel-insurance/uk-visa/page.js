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
    text: "Pick your travel dates for the UK, choose the United Kingdom as destination, and add each traveler. The form is set up for the cover UKVI caseworkers want to see on a Standard Visitor visa file.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's details exactly as they appear on the passport. VFS UK in Dubai and Abu Dhabi will flag any mismatch between your certificate and the visa application.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your UK-ready AXA certificate arrives by email within minutes. Print it and bring it to your VFS UK biometrics appointment the same day.",
  },
];

const testimonials = [
  {
    quote:
      "Applied for the Standard Visitor visa to see family in London. Travl had the AXA certificate emailed in under fifteen minutes, perfectly formatted, and VFS UK in Dubai accepted it without a single question.",
    name: "Hassan A.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "UK Visa Insurance",
  },
  {
    quote:
      "Booked a two-week trip to London and Manchester. The policy showed clear medical cover and trip dates — exactly what the caseworker wanted to see. Visa came back approved in nine days.",
    name: "Reema S.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "UK Visa Insurance",
  },
  {
    quote:
      "I'd heard NHS treatment isn't free for tourists, so I wanted real cover and not just paperwork. Travl gave me both. Honestly relieved.",
    name: "Olu T.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "UK Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Built for the UK Standard Visitor Visa",
    text: "Coverage and certificate wording aligned with what UKVI caseworkers and VFS UK expect to see on a Standard Visitor visa application from the UAE.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "A genuine AXA travel medical policy. Valid for your UK visa submission and for real medical emergencies during your trip — NHS care for visitors is not free.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate arrives by email within minutes of payment. Submit at VFS UK the same day with no extra trips.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency treatment, hospitalization, repatriation, baggage, trip cancellation, and travel delays are all included.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "UK visa travel insurance plans that meet caseworker expectations without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to the UK once, or to Europe and the UK several times a year? Pick the plan that fits how often you travel.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for a UK visa?",
    answer:
      "No. UK Visas and Immigration does not list travel insurance as a mandatory document for the Standard Visitor visa. It is strongly recommended though — NHS treatment is not free for short-term visitors, and a caseworker will look more favorably on a well-prepared application that includes insurance.",
  },
  {
    question: "Does this insurance work for the UK Standard Visitor visa?",
    answer:
      "Yes. Our policies are designed for short stays under the Standard Visitor route (up to 6 months) and include the medical and travel coverage UAE residents typically need for a UK trip.",
  },
  {
    question: "Is the policy accepted by VFS Global UK in the UAE?",
    answer:
      "Yes. UK visa applications in the UAE go through VFS Global UK in Dubai and Abu Dhabi. Our AXA certificates are formatted to be acceptable at those centers and to be read clearly by UKVI caseworkers in Sheffield.",
  },
  {
    question: "How much medical coverage should a UK visa policy include?",
    answer:
      "There is no official minimum from UKVI, but at least GBP 100,000 in medical cover is the sensible benchmark — NHS treatment for visitors is charged at full cost, and emergency hospitalization can run into tens of thousands of pounds quickly.",
  },
  {
    question: "Does this cover work, study, or long-stay UK visas?",
    answer:
      "No. This product is for short-stay (Standard Visitor) trips. UK work, study, and family routes usually require either NHS surcharge payment or a specific long-stay insurance product. Email us before purchasing if you are applying for a long-stay visa.",
  },
  {
    question: "How much does UK visa travel insurance cost for UAE residents?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip, and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to print and submit at your VFS UK appointment the same day.",
  },
  {
    question: "Do I need insurance before booking my flights to the UK?",
    answer:
      "You need it before your VFS appointment, not before booking. Many applicants get the insurance and a flight reservation together so the full file is ready for one biometrics visit.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for UK Visa | From AED 30 | Travl",
    description:
      "Get a UK visa-ready travel insurance policy online. Real AXA medical cover for the Standard Visitor visa, accepted by VFS UK. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/uk-visa",
  },
  sections: {
    hero: {
      title: "UK Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · VFS Global UK Accepted",
      text: "Get a UK Standard Visitor visa-ready travel insurance policy online instantly. Real AXA medical cover, formatted for UKVI caseworkers and VFS UK in the UAE. Plans from AED 30.",
      pills: [
        "Standard Visitor Visa",
        "VFS Global UK Accepted",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for a UK Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We provide UK visa travel insurance designed for UAE residents applying for the Standard Visitor visa. Policies are issued by AXA, formatted to be read clearly by UKVI caseworkers, and accepted at VFS Global UK centers in Dubai and Abu Dhabi. Buy your policy online, receive it instantly, and submit your visa application with confidence.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "UK Travel Insurance",
          description:
            "AXA-issued travel medical insurance tailored to the UK Standard Visitor visa. Delivered to your inbox within minutes of payment.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for UK Visa",
          description:
            "Verifiable flight itinerary with a real PNR — the onward travel proof UKVI expects alongside your insurance. From AED 49.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Proof of accommodation is a UK visa requirement. We issue hotel reservations by email, formatted to caseworker standards.",
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
      title: "UK Visa Travel Insurance FAQ",
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
          { label: "UK Visa", path: "/travel-insurance/uk-visa" },
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
        title="Why UAE Residents Choose Us for UK Visa Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their UK visa insurance"
        testimonials={testimonials}
      />
      <Faqs
        title="UK Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about UK visa travel insurance for UAE residents"
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
