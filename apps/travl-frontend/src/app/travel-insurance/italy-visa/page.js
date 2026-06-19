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
    text: "Pick your dates for Italy, choose Europe as the destination, and add each traveler. The form is set up for the cover the Italian consulate looks for.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's details exactly as written on the passport. VFS Italy will flag any mismatch between your certificate and your visa application.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your Italy-ready AXA certificate is in your inbox within minutes. Submit it at your VFS Italy appointment the same day.",
  },
];

const testimonials = [
  {
    quote:
      "Was going to Rome for a wedding and panicking with five days to spare. Travl had the AXA certificate in my inbox by lunchtime and VFS Italy in Dubai accepted it without any back and forth.",
    name: "Khaled M.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Italy Visa Insurance",
  },
  {
    quote:
      "Two adults and a kid going to Florence. The whole insurance step took fifteen minutes online. All three certificates spelled exactly right and the VFS officer just moved through them.",
    name: "Sneha P.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Italy Visa Insurance",
  },
  {
    quote:
      "Italian consulate is strict about wording, I'd heard. Got the policy here, EUR 30,000 was clearly stated, valid across Schengen, no problem. Visa approved in nine days.",
    name: "Marco D.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Italy Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Meets Italian Consulate Requirements",
    text: "EUR 30,000 medical coverage across the entire Schengen Area, including Italy, written exactly the way VFS Italy and the Italian consulate expect.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "A genuine AXA travel medical policy. Valid for your Italy visa submission and for real medical emergencies during your trip.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate arrives by email within minutes of payment. Submit at VFS Italy the same day with no extra trips.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency treatment, hospitalization, repatriation, baggage, trip cancellation, and travel delays are all included.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "Italy visa insurance plans that meet the consulate's requirements without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to Italy once, or to Europe multiple times this year? Pick the plan that fits how often you travel.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for an Italy visa?",
    answer:
      "Yes. The Italian consulate requires travel insurance for every Schengen short-stay (Type C) visa application. The policy must include a minimum of EUR 30,000 in medical coverage, be valid throughout the Schengen Area, and cover the full duration of your trip.",
  },
  {
    question: "Is this insurance accepted by VFS Global Italy?",
    answer:
      "Yes. Italy visa applications in the UAE go through VFS Global Italy in Dubai and Abu Dhabi. Our certificates are formatted exactly the way VFS Italy and the Italian consulate expect to see them.",
  },
  {
    question: "What does the Italian consulate require on the certificate?",
    answer:
      "Three things: at least EUR 30,000 in medical cover, validity across the entire Schengen Area (not just Italy), and dates that cover your full intended stay. Our certificates spell all three out clearly.",
  },
  {
    question: "Does this work for tourist, business, and family visit visas?",
    answer:
      "Yes. The same EUR 30,000 Schengen cover applies across all Italy short-stay visa categories — tourism, business, family visit, or visiting a friend.",
  },
  {
    question: "Does this cover an Italian long-stay (Type D) visa?",
    answer:
      "Italian long-stay visas — for study, work, family reunification, or stays over 90 days — usually require a specific long-stay insurance product, not a Schengen short-stay policy. Email us before purchasing if you are applying for a long-stay visa.",
  },
  {
    question: "How much does Italy visa insurance cost?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip, and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to print and submit at VFS Italy the same day.",
  },
  {
    question: "Do I need insurance before booking my flights to Italy?",
    answer:
      "You need it before your VFS appointment, not before booking. Most applicants get the insurance and a flight reservation together so the whole file is ready in one go.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for Italy Visa | From AED 30 | Travl",
    description:
      "Get embassy-compliant Italy visa travel insurance online. EUR 30,000 medical coverage across the Schengen Area, accepted by VFS Global Italy. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/italy-visa",
  },
  sections: {
    hero: {
      title: "Italy Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · VFS Global Italy Accepted",
      text: "Get an Italy visa-ready travel insurance policy online instantly. EUR 30,000 medical coverage across the entire Schengen Area, written the way the Italian consulate expects to see it. Plans from AED 30.",
      pills: [
        "EUR 30,000 Coverage",
        "VFS Global Italy Accepted",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for an Italy Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We help UAE residents put together the paperwork for Italy short-stay visa applications. Every travel insurance policy includes the mandatory EUR 30,000 medical coverage across the Schengen Area, is underwritten by AXA, and is accepted by VFS Global Italy in Dubai and Abu Dhabi. Buy online, get the certificate by email, and submit the same day.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Italy Visa Travel Insurance",
          description:
            "Embassy-compliant travel insurance for Italy visa applications. EUR 30,000 medical coverage across the Schengen Area, issued by AXA, delivered instantly to your email.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for Italy Visa",
          description:
            "A verified flight reservation with a real PNR code, the proof of onward travel VFS Italy expects alongside your insurance. From USD 13 via Dummy Ticket 365.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Proof of accommodation in Italy is part of a complete visa file. We provide hotel reservations by email, formatted the way the consulate expects.",
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
      title: "Italy Visa Travel Insurance FAQ",
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
          { label: "Italy Visa", path: "/travel-insurance/italy-visa" },
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
        title="Why UAE Residents Choose Us for Italy Visa Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their Italy visa application"
        testimonials={testimonials}
      />
      <Faqs
        title="Italy Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about Italy visa insurance for UAE residents"
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
              { name: "Germany Visa Insurance", href: "/travel-insurance/germany-visa" },
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
