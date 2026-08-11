import Link from "next/link";
import Hero from "@travel-suite/frontend-shared/components/sections/v2/Hero";
import HowItWorks from "@travel-suite/frontend-shared/components/sections/v2/HowItWorks";
import About from "@travel-suite/frontend-shared/components/sections/v2/About";
import Benefits from "@travel-suite/frontend-shared/components/sections/v2/Benefits";
import Testimonials from "@travel-suite/frontend-shared/components/sections/v2/Testimonials";
import Faqs from "@travel-suite/frontend-shared/components/sections/v2/Faqs";
import Contact from "@travel-suite/frontend-shared/components/sections/v2/Contact";
import BlogPosts from "@travel-suite/frontend-shared/components/sections/v2/BlogPosts";
import Container from "@travel-suite/frontend-shared/components/shared/layout/Container";
import PrimarySection from "@travel-suite/frontend-shared/components/shared/layout/PrimarySection";
import {
  SITE_URL,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from "@/lib/schema";
import { homepageFaqs } from "@/data/faqs";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Headphones,
  Banknote,
  Globe,
  FileCheck,
} from "lucide-react";
import { MdOutlineHealthAndSafety, MdOutlineTravelExplore } from "react-icons/md";

const testimonials = [
  {
    quote:
      "I needed Schengen insurance in a hurry and Travl sorted it in minutes. The cover met the 30,000 euro requirement, the policy read clearly, and my visa came back approved with no follow-up questions.",
    name: "David S.",
    location: "Traveler from the United States",
    stars: 5,
  },
  {
    quote:
      "I was in a rush and Travl delivered exactly what I needed. The process was simple, the service was reliable, and I had my insurance ready in minutes. Definitely using this again.",
    name: "Maria K.",
    location: "Tourist from the United Kingdom",
    stars: 5,
  },
  {
    quote:
      "I fly often so I went with the annual multi-trip plan. Signing up took a few minutes, the document was accepted at the VFS centre straight away, and support replied every time I had a question. Solid value.",
    name: "Ahmed R.",
    location: "Frequent Flyer from India",
    stars: 5,
  },
];

const benefits = [
  {
    icon: MdOutlineHealthAndSafety,
    title: "Underwritten by AXA",
    text: "Every policy is issued by AXA, not a broker's own paper. That is the name consulates and hospitals recognise when it matters.",
  },
  {
    icon: Zap,
    title: "Policy in Your Inbox in Minutes",
    text: "Buy online and the certificate arrives by email straight away. No waiting on an agent, no office visit, no callback.",
  },
  {
    icon: FileCheck,
    title: "Meets Schengen Requirements",
    text: "EUR 30,000 minimum medical cover across the whole Schengen Area, formatted the way consulates and VFS Global expect it.",
  },
  {
    icon: Globe,
    title: "Cover Wherever You Are Going",
    text: "Single trip, annual multi-trip, family and worldwide plans, for Europe and well beyond it.",
  },
  {
    icon: Headphones,
    title: "3-Minute Response Time",
    text: "Message us during business hours and you will usually hear back within three minutes. Outside them, within the hour.",
  },
  {
    icon: Banknote,
    title: "From AED 30, No Hidden Fees",
    text: "The price you see is the price you pay. No booking fee, no card surcharge, no admin charge at the end.",
  },
];

const HOW_IT_WORKS = [
  {
    title: "Tell us about your trip",
    text: "Dates, destination and travellers. It takes about a minute and you get a price immediately.",
  },
  {
    title: "Pick your plan",
    text: "Compare single trip, annual and family cover side by side, with the medical limits shown up front.",
  },
  {
    title: "Get your policy by email",
    text: "Pay online and your AXA certificate arrives in minutes, ready to attach to a visa application.",
  },
];

const pageData = {
  meta: {
    title: "AXA Travel Insurance for UAE Residents | Travl",
    description:
      "Travel insurance issued by AXA for UAE residents, from AED 30. EUR 30,000 medical cover that meets Schengen visa requirements, delivered to your inbox in minutes.",
    canonical: SITE_URL,
  },
  hero: {
    title: "Travel Insurance, Issued by AXA and Delivered in Minutes",
    text: "Cover that meets Schengen visa requirements and works far beyond Europe. Get a price in under a minute and your certificate by email the same day.",
    pills: [
      "Underwritten by AXA",
      "From AED 30",
      "EUR 30,000 Medical Cover",
      "Instant Email Delivery",
    ],
  },
};

export const metadata = {
  title: pageData.meta.title,
  description: pageData.meta.description,
  alternates: { canonical: pageData.meta.canonical },
  robots: { index: true, follow: true },
  openGraph: {
    url: pageData.meta.canonical,
    title: pageData.meta.title,
    description: pageData.meta.description,
  },
};

export const revalidate = 300;

/**
 * The plans people actually shop for. Deliberately a short list: the full
 * catalogue lives on /travel-insurance, which stays the hub for comparison.
 */
const PLANS = [
  {
    name: "Single Trip",
    href: "/travel-insurance/single-trip",
    price: "From AED 30",
    text: "One journey, fixed dates. The usual choice for a Schengen visa application.",
  },
  {
    name: "Annual Multi-Trip",
    href: "/travel-insurance/annual-multi-trip",
    price: "From AED 245",
    text: "Unlimited trips over 12 months. Works out cheaper from about the third trip.",
  },
  {
    name: "Family",
    href: "/travel-insurance/family",
    price: "One policy",
    text: "Both parents and the children on a single certificate, at a lower combined price.",
  },
  {
    name: "Schengen Visa",
    href: "/travel-insurance/schengen-visa",
    price: "EUR 30,000 cover",
    text: "Written specifically to satisfy the Schengen medical-cover requirement.",
  },
];

function PlanGrid() {
  return (
    <PrimarySection className="py-14 md:py-20">
      <Container>
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Choose Your Cover
          </h2>
          <p className="mt-3 leading-relaxed text-gray-500">
            Every plan is underwritten by AXA and delivered by email within
            minutes of payment. Pick the shape that fits your trip.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Link
              key={plan.href}
              href={plan.href}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(16,24,40,0.06)] transition-colors hover:border-primary-300"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
                {plan.price}
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">{plan.name}</p>
              <p className="mt-2 grow text-sm leading-relaxed text-gray-500">
                {plan.text}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
                See cover <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/travel-insurance"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
          >
            Compare every plan <ArrowRight size={15} />
          </Link>
        </div>
      </Container>
    </PrimarySection>
  );
}

export default function HomePage() {
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: pageData.meta.canonical,
      title: pageData.meta.title,
      description: pageData.meta.description,
    }),
    buildService({
      canonical: pageData.meta.canonical,
      name: "Travel Insurance for UAE Residents",
      description: pageData.meta.description,
      areaServed: "AE",
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: "Frequently Asked Questions",
      description: pageData.meta.description,
      faqs: homepageFaqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Hero
        title={pageData.hero.title}
        text={pageData.hero.text}
        pills={pageData.hero.pills}
      />
      <PlanGrid />
      <HowItWorks
        title="How It Works"
        subtitle="Three steps from a price to a policy in your inbox, with no paperwork in between"
        steps={HOW_IT_WORKS}
      />
      <About
        title="About Us"
        text="Travl Technologies LLC is a licensed travel agency based in Dubai, UAE. We sell AXA-underwritten travel insurance to residents across the UAE and GCC, and we build the day-by-day travel itineraries that visa applications often ask for."
        services={[
          {
            icon: <MdOutlineHealthAndSafety />,
            title: "Travel Insurance",
            description:
              "AXA-underwritten cover from AED 30, with EUR 30,000 of medical protection that meets the Schengen requirement. Single trip, annual multi-trip, family and worldwide plans, all delivered by email within minutes of payment.",
          },
          {
            icon: <MdOutlineTravelExplore />,
            title: "Travel Itineraries",
            description:
              "A day-by-day plan of your trip, formatted the way consulates expect to see it. Useful when an embassy asks for a detailed itinerary alongside the rest of your file.",
          },
        ]}
      />
      <Benefits
        title="Why UAE Residents Choose Travl"
        subtitle="AXA cover, honest pricing, and a team that answers quickly"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who bought their cover through us"
        testimonials={testimonials}
      />
      <Faqs
        title="Frequently Asked Questions"
        subtitle="Common questions about coverage, Schengen requirements, and how your policy is delivered"
        faqs={homepageFaqs}
      />
      <BlogPosts
        title="From the Blog"
        subtitle="Guides on travel insurance and trip planning for UAE residents"
      />
      <Contact email="info@travl.ae" />
    </>
  );
}
