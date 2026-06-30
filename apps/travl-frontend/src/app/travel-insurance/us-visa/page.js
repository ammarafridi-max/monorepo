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
    text: "Pick your dates for the United States, choose the US as destination, and add each traveler. The form is set up for the medical cover most B1/B2 applicants want for a US trip.",
  },
  {
    title: "Fill in Passenger Details",
    text: "Enter each traveler's name and passport details exactly as they appear on the passport. The US Embassy will compare your DS-160 details against any documents you bring to the interview.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your US-ready AXA certificate arrives by email within minutes. Bring it to your US visa interview the same day if you like — or simply carry it on your trip for real medical protection.",
  },
];

const testimonials = [
  {
    quote:
      "Got my US B1/B2 interview slot late and rushed everything. Travl had the AXA certificate emailed in about ten minutes — solid medical cover, perfectly formatted. One less thing to worry about at the embassy.",
    name: "Rohan V.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "US Visa Insurance",
  },
  {
    quote:
      "I'd read about how expensive an ER visit can be in the US. Wanted real cover, not just a piece of paper. The policy from Travl gave me USD-level medical cover for our New York trip and we used it for our visa file too.",
    name: "Aisha B.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "US Visa Insurance",
  },
  {
    quote:
      "Two-week family trip to California. Insurance was sorted in one evening online for all four of us. Visa interview went smoothly, no questions about funds or insurance.",
    name: "Mehmet O.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "US Visa Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Cover Built for US Medical Costs",
    text: "Strong medical limits aligned with how expensive emergency care in the US can be. Hospitalization in the US can run into tens of thousands of dollars within hours.",
  },
  {
    icon: FileCheck,
    title: "Real Travel Insurance, Not a Placeholder",
    text: "A genuine AXA travel medical policy. Useful for your US visa application file and essential for real medical emergencies during your trip — US healthcare is not free for tourists.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate arrives by email within minutes of payment. Print it for your interview the same day, or save it for your trip.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Coverage",
    text: "Emergency treatment, hospitalization, repatriation, baggage, trip cancellation, and travel delays are all included.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "US trip insurance plans that meet sensible medical limits without paying for extras you do not need.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Going to the US once, or traveling internationally several times a year? Pick the plan that fits how often you travel.",
  },
];

export const faqs = [
  {
    question: "Is travel insurance mandatory for a US visa?",
    answer:
      "No. The US Embassy and USCIS do not require travel insurance for B1/B2 visa applications. However, US healthcare is among the most expensive in the world — a serious medical event without insurance can cost tens of thousands of dollars, so travel insurance is strongly recommended for any US trip.",
  },
  {
    question: "How much medical coverage should a US trip policy include?",
    answer:
      "USD 100,000 in medical coverage is the practical minimum — US emergency rooms regularly bill that much for a single serious incident. Higher cover is sensible if you'll be visiting for more than a few weeks or doing anything adventurous.",
  },
  {
    question: "Does this insurance work for B1, B2, and combined B1/B2 visas?",
    answer:
      "Yes. The same travel medical cover applies for tourism (B2), business (B1), or a combined B1/B2 visitor visa for the United States.",
  },
  {
    question: "Will the US Embassy ask to see my travel insurance?",
    answer:
      "Usually not at the interview itself. Consular officers focus on intent to return, ties to your home country, and finances. Insurance is mainly for your protection while in the US — but having it stamps the file as well prepared.",
  },
  {
    question: "Does this cover student (F-1) or work (H-1B) visas?",
    answer:
      "No. US student and work visa holders typically arrange health insurance through their school or employer once in the US. This product is for short-stay B1/B2 trips. Email us before purchasing if you are applying for a long-stay visa.",
  },
  {
    question: "How much does US travel insurance cost for UAE residents?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip, and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. The AXA certificate arrives by email and is ready to print or save to your phone for the trip.",
  },
  {
    question: "Do I need insurance before booking my flights to the US?",
    answer:
      "No, you can purchase it any time before you travel. Most people get insurance and a flight reservation together when preparing the visa file so everything is in one place.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for US Visa | From AED 30 | Travl",
    description:
      "Get travel insurance for your US B1/B2 visa trip. Real AXA medical cover sized for US healthcare costs. Instant policy for UAE residents from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/us-visa",
  },
  sections: {
    hero: {
      title: "US Visa Travel Insurance for UAE Residents from AED 30",
      subtitle: "From AED 30 · Built for US Medical Costs",
      text: "Get travel insurance for your B1/B2 US trip online instantly. Real AXA medical cover sized for the cost of US healthcare, useful for your visa file and essential for your trip. Plans from AED 30.",
      pills: [
        "B1/B2 Visitor Visa",
        "USD-Level Medical Cover",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for a US Visa",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We provide US travel insurance designed for UAE residents traveling on the B1/B2 visitor visa. Policies are issued by AXA, sized for the realities of US medical bills, and delivered to your inbox in minutes. Useful at the visa interview as a sign of a well-prepared file, and essential for your protection once you land.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "US Travel Insurance",
          description:
            "AXA-issued travel medical insurance sized for US healthcare costs. Delivered to your inbox within minutes of payment.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itinerary for US Visa",
          description:
            "Verifiable flight itinerary with a real PNR — useful as proof of onward travel for your B1/B2 interview file. From AED 49.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Hotel reservations by email, formatted to interview-ready standards — handy for showing planned accommodation at your US visa appointment.",
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
      title: "US Visa Travel Insurance FAQ",
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
          { label: "US Visa", path: "/travel-insurance/us-visa" },
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
        title="Why UAE Residents Choose Us for US Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their US trip insurance"
        testimonials={testimonials}
      />
      <Faqs
        title="US Visa Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about US travel insurance for UAE residents"
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
