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
    text: "Pick your travel dates for Bali or anywhere in Indonesia, choose Asia as the region, and add each traveler. You get an instant quote with the cover level shown up front.",
  },
  {
    title: "Fill in Traveler Details",
    text: "Add each traveler's name and passport details exactly as they appear on the passport, so your policy certificate matches your travel documents at the airport.",
  },
  {
    title: "Pay and Receive Your Policy",
    text: "Pay online and your AXA travel insurance certificate arrives by email within minutes. Save it to your phone and you are covered from the first day of your trip.",
  },
];

const testimonials = [
  {
    quote:
      "Ten days across Bali and Lombok. Sorted the AXA travel insurance with Travl the night before we flew and the certificate was in my inbox in minutes. Real peace of mind for the diving and the scooter rides.",
    name: "Rashid A.",
    location: "Dubai, UAE",
    stars: 5,
    plan: "Bali Travel Insurance",
  },
  {
    quote:
      "Family trip to Bali with two kids. One policy covered all four of us across Ubud and the Gili Islands, and the price beat what my bank quoted. Buying it took about five minutes.",
    name: "Priya S.",
    location: "Abu Dhabi, UAE",
    stars: 5,
    plan: "Indonesia Travel Insurance",
  },
  {
    quote:
      "Booked a last-minute Bali getaway. I needed travel insurance and proof of onward travel for the visa on arrival, and got both from Travl in one sitting. Immigration in Denpasar was quick and easy.",
    name: "Mohammed H.",
    location: "Sharjah, UAE",
    stars: 5,
    plan: "Bali Travel Insurance",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Cover for the Whole of Indonesia",
    text: "One policy covers Bali, Jakarta, Lombok, the Gili Islands and anywhere else your Indonesia trip takes you, so you are protected across the country.",
  },
  {
    icon: FileCheck,
    title: "Real AXA Travel Insurance",
    text: "A genuine AXA travel medical policy, not a placeholder. Valid for real medical emergencies and hospital treatment during your Bali or Indonesia trip.",
  },
  {
    icon: Zap,
    title: "Instant Policy Delivery",
    text: "Your certificate arrives by email within minutes of payment. Buy it the night before you fly and you are covered from the moment your trip starts.",
  },
  {
    icon: HeartPulse,
    title: "Full Medical and Travel Cover",
    text: "Emergency treatment, hospitalization, medical repatriation, baggage, trip cancellation and travel delays are all included on your Indonesia travel insurance.",
  },
  {
    icon: Banknote,
    title: "Plans From AED 30",
    text: "Bali travel insurance that covers what matters for an Indonesia trip, without paying for extras you will not use.",
  },
  {
    icon: RefreshCw,
    title: "Single Trip or Annual Cover",
    text: "Heading to Bali once, or travelling through Asia regularly? Single-trip and annual multi-trip plans are both available.",
  },
];

export const faqs = [
  {
    question: "Do you need travel insurance for Bali?",
    answer:
      "It is not legally required to enter Bali or Indonesia, but you should still get it. Private hospital care in Bali is expensive to pay out of pocket, and travel insurance for Bali covers medical emergencies, hospital stays, medical repatriation, lost baggage and trip disruption for your whole trip.",
  },
  {
    question: "Is travel insurance mandatory to enter Indonesia?",
    answer:
      "No. Indonesia does not require UAE residents to hold travel insurance to enter on a visa on arrival or visa-free entry. It is strongly recommended rather than compulsory, mainly because of how much medical care can cost if something goes wrong on your trip.",
  },
  {
    question: "What does Bali travel insurance cover?",
    answer:
      "An AXA Bali travel insurance policy covers emergency medical treatment, hospitalization, medical repatriation, personal baggage, trip cancellation and travel delays across Indonesia. The exact cover level is stated clearly on your certificate.",
  },
  {
    question: "Does it cover medical emergencies in Bali?",
    answer:
      "Yes. Emergency treatment and hospital care in Bali and the rest of Indonesia are covered up to the limit on your policy. That cover is the main reason travel insurance for Indonesia is worth having.",
  },
  {
    question: "Does it cover scooter or motorbike accidents in Bali?",
    answer:
      "Cover for riding a scooter or motorbike depends on the policy terms, and most policies require a valid licence and a helmet. Read the wording before you ride, and email us if you want this confirmed for your plan.",
  },
  {
    question: "Does the policy cover all of Indonesia, not just Bali?",
    answer:
      "Yes. The same travel insurance covers Bali, Jakarta, Lombok, the Gili Islands and the rest of Indonesia, so you are covered wherever your trip takes you.",
  },
  {
    question: "How much does travel insurance for Bali cost?",
    answer:
      "Plans start from AED 30. The exact price depends on your travel dates, length of trip and number of travelers. Get an instant quote on this page.",
  },
  {
    question: "How quickly will I receive my policy?",
    answer:
      "Within minutes of payment. Your AXA certificate arrives by email, ready to save to your phone before you fly to Bali.",
  },
  {
    question: "Do I need proof of onward travel for a Bali visa on arrival?",
    answer:
      "Indonesian immigration can ask to see proof of onward or return travel and accommodation. A verified flight reservation and a hotel booking cover this, and you can arrange both here alongside your travel insurance.",
  },
];

export const pageData = {
  meta: {
    title: "Travel Insurance for Bali & Indonesia | From AED 30 | Travl",
    description:
      "Travel insurance for Bali and Indonesia for UAE residents. AXA-backed emergency medical, hospital, baggage and trip cover for your Indonesia trip. Instant policy from AED 30.",
    canonical: "https://www.travl.ae/travel-insurance/indonesia",
  },
  sections: {
    hero: {
      title: "Travel Insurance for Bali and Indonesia for UAE Residents from AED 30",
      subtitle: "From AED 30 · AXA-Backed · Instant Policy",
      text: "Get travel insurance for your Bali or wider Indonesia trip in minutes. AXA-backed medical and travel cover for UAE residents, delivered by email the moment you pay. Plans from AED 30.",
      pills: [
        "AXA-Backed Cover",
        "Whole of Indonesia",
        "Instant Delivery",
        "From AED 30",
      ],
    },
    process: {
      title: "How to Get Travel Insurance for Bali",
      subtitle: "Get covered in 3 quick steps",
      steps: processSteps,
    },
    about: {
      title: "About Our Services",
      text: "We help UAE residents get ready for trips to Bali and the rest of Indonesia. Every travel insurance policy is underwritten by AXA and covers emergency medical care, hospital treatment, baggage and trip disruption for your time in Indonesia. Buy online, get the certificate by email, and travel with real cover behind you.",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Bali & Indonesia Travel Insurance",
          description:
            "AXA-backed travel insurance for your Bali or Indonesia trip. Emergency medical, hospitalization, repatriation, baggage and trip cover, delivered instantly to your email.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Reservation",
          description:
            "A verified flight reservation with a real PNR code, useful as proof of onward travel if immigration asks at your Bali visa on arrival.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservation",
          description:
            "Proof of accommodation helps you clear immigration smoothly in Indonesia. We provide hotel reservations by email for your visa on arrival or arrival check.",
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
      title: "Bali & Indonesia Travel Insurance FAQ",
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
          { label: "Indonesia", path: "/travel-insurance/indonesia" },
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
        title="Why UAE Residents Choose Us for Bali Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who insured their Bali and Indonesia trips with Travl"
        testimonials={testimonials}
      />
      <Faqs
        title="Bali Travel Insurance — Frequently Asked Questions"
        subtitle="Everything you need to know about travel insurance for Bali and Indonesia for UAE residents"
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
              { name: "UK Visa Insurance", href: "/travel-insurance/uk-visa" },
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
