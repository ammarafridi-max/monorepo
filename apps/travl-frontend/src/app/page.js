import Link from "next/link";
import Hero from "@travel-suite/frontend-shared/components/sections/v2/Hero";
import HowItWorks from "@travel-suite/frontend-shared/components/sections/v2/HowItWorks";
import About from "@travel-suite/frontend-shared/components/sections/v2/About";
import Benefits from "@travel-suite/frontend-shared/components/sections/v2/Benefits";
import Testimonials from "@travel-suite/frontend-shared/components/sections/v2/Testimonials";
import Faqs from "@travel-suite/frontend-shared/components/sections/v2/Faqs";
import Contact from "@travel-suite/frontend-shared/components/sections/v2/Contact";
import BlogPosts from "@travel-suite/frontend-shared/components/sections/v2/BlogPosts";
import VisaCard from "@travel-suite/frontend-shared/components/cards/VisaCard";
import Container from "@travel-suite/frontend-shared/components/shared/layout/Container";
import PrimarySection from "@travel-suite/frontend-shared/components/shared/layout/PrimarySection";
import { getPublicVisasApi } from "@travel-suite/frontend-shared/services/apiVisa";
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
import { WHATSAPP_URL } from "@/config/contact";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  FileCheck,
  Headphones,
  Banknote,
  Globe,
  Check,
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

// Reordered so the visa-application benefits lead and insurance supports.
const benefits = [
  {
    icon: FileCheck,
    title: "Every Document Checked Before You Submit",
    text: "A specialist reviews your file against current embassy requirements and flags the gaps that cause refusals, before it reaches the counter.",
  },
  {
    icon: Globe,
    title: "Schengen, UK, US and Canada",
    text: "Application support for the destinations UAE residents apply to most, including France, Germany, Italy and Spain individually.",
  },
  {
    icon: Headphones,
    title: "3-Minute Response Time",
    text: "Message us on WhatsApp or by email during business hours and you will usually hear back within three minutes. Outside them, within the hour.",
  },
  {
    icon: ShieldCheck,
    title: "Travel Insurance from AED 30",
    text: "Schengen-compliant AXA-backed cover with the required medical limits, valid across all 29 Schengen states and issued instantly.",
  },
  {
    icon: Zap,
    title: "Embassy-Accepted Formats",
    text: "Everything we prepare is formatted to meet the requirements of embassies, VFS Global and BLS International. Submit with confidence.",
  },
  {
    icon: Banknote,
    title: "No Hidden Fees",
    text: "The price you see is the price you pay. Embassy and visa-centre fees are passed through at cost and never marked up.",
  },
];

const HOW_IT_WORKS = [
  {
    title: "Tell us about your trip",
    text: "Share your destination, travel dates and situation. It takes a few minutes and costs nothing.",
  },
  {
    title: "We prepare and check the file",
    text: "A specialist builds your application, reviews every document and fixes the gaps before submission.",
  },
  {
    title: "Submit and track to a decision",
    text: "We book your appointment, brief you on the day, and follow the application until your passport is back.",
  },
];

const pageData = {
  meta: {
    title: "Visa Assistance for UAE Residents | Travl",
    description:
      "Expert visa application support for UAE residents. Schengen, UK, US and Canada. Document review, appointment booking and full file preparation from AED 299.",
    canonical: SITE_URL,
  },
  sections: {
    hero: {
      title: "Visa Assistance for UAE Residents",
      text: "Most refusals come from document errors that were preventable. Our Dubai specialists build your application and check every page before it goes in.",
      pills: [
        "Licensed Dubai Office",
        "3-Minute Response Time",
        "Document Review Included",
        "Native-Language Support",
      ],
    },
    process: {
      title: "How It Works",
      subtitle:
        "Three steps from first consultation to a decision, with a specialist on your file throughout",
    },
    about: {
      title: "About Us",
      services: [
        {
          icon: <MdOutlineTravelExplore />,
          title: "Visa Assistance",
          description:
            "Application support for Schengen, UK, US and Canada, plus France, Germany, Italy and Spain individually. We review your documents, prepare the full file, book your appointment and track the application until a decision is made. Packages from AED 299.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Insurance",
          description:
            "Genuine AXA-backed travel insurance for UAE residents. Schengen-compliant plans from AED 30, worldwide coverage from AED 70, and annual multi-trip plans from AED 245. Every policy is delivered instantly after payment.",
        },
      ],
    },
    benefits: {
      title: "Why UAE Residents Choose Travl",
      subtitle:
        "A licensed travel agency based in Dubai, trusted for visa applications and travel documentation across the UAE and GCC",
      benefits,
    },
    testimonials: {
      title: "What Our Customers Say",
      subtitle:
        "Real feedback from travelers across the UAE who used Travl for their visa documents",
      testimonials,
    },
    faqs: {
      title: "Frequently Asked Questions",
      subtitle:
        "Common questions about our services, delivery times, and what you need for your visa application",
      faqs: homepageFaqs,
    },
    blogs: {
      title: "From the Blog",
      subtitle:
        "Guides and tips on visa applications, travel documents, and planning your trip from the UAE",
    },
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
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: pageData.meta.title,
    description: pageData.meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const revalidate = 300;

/**
 * Hero panel. Replaces the insurance quote form that Hero renders by default,
 * so the primary action on the homepage is a visa consultation.
 */
function VisaConsultCard() {
  const included = [
    "Document review against current embassy rules",
    "Cover letter, itinerary and flight reservation",
    "VFS or BLS appointment booked for you",
    "Tracked until your passport comes back",
  ];

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
        Free consultation
      </p>
      <p className="mt-2 text-xl font-bold text-gray-900 leading-snug">
        Find out what your application needs
      </p>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        Tell us where you are going and we will tell you exactly what to prepare. No obligation.
      </p>

      <ul className="mt-5 flex flex-col gap-2.5">
        {included.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] text-gray-600 leading-snug">
            <Check size={14} className="text-primary-600 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href="/visa"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 hover:bg-primary-800 px-5 py-3 text-sm font-semibold text-white transition-colors"
        >
          Get free consultation <ArrowRight size={15} />
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
        >
          Ask on WhatsApp
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Packages from AED 299. Insurance available separately from AED 30.
      </p>
    </div>
  );
}

/** Destination grid, using the same card as the /visa listing. */
function VisaDestinations({ visas }) {
  if (!visas.length) return null;

  return (
    <PrimarySection className="py-14 md:py-20">
      <Container>
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Visas We Handle
          </h2>
          <p className="mt-3 text-gray-500 leading-relaxed">
            Full application support for the destinations UAE residents apply to most. Every
            package includes document review, file preparation and appointment booking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visas.map((visa) => (
            <VisaCard key={visa.slug} visa={visa} />
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/visa"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors"
          >
            See all destinations <ArrowRight size={15} />
          </Link>
        </div>
      </Container>
    </PrimarySection>
  );
}

// The API sorts alphabetically, which buries Schengen and drops the biggest
// destinations off the end of a six-card grid. Lead with demand instead.
const DESTINATION_ORDER = [
  "schengen",
  "united-kingdom",
  "usa",
  "canada",
  "germany-visa",
  "france-visa",
  "italy-visa",
  "spain-visa",
];

function orderDestinations(visas) {
  const rank = (v) => {
    const i = DESTINATION_ORDER.indexOf(v.slug);
    return i === -1 ? DESTINATION_ORDER.length : i;
  };
  return [...visas].sort((a, b) => rank(a) - rank(b) || a.countryName.localeCompare(b.countryName));
}

export default async function HomePage() {
  const visas = await getPublicVisasApi().catch(() => []);
  const all = Array.isArray(visas) ? visas : visas?.visas || [];
  const list = orderDestinations(all).slice(0, 6);

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
      name: "Visa Assistance for UAE Residents",
      description: pageData.meta.description,
      areaServed: "AE",
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: "Frequently Asked Questions",
      description: pageData.meta.description,
      faqs: pageData.sections.faqs.faqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Hero
        title={pageData.sections.hero.title}
        text={pageData.sections.hero.text}
        pills={pageData.sections.hero.pills}
        form={<VisaConsultCard />}
      />
      <VisaDestinations visas={list} />
      <HowItWorks
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={HOW_IT_WORKS}
      />
      <About
        title={pageData.sections.about.title}
        text="Travl Technologies LLC is a licensed travel agency based in Dubai, UAE. We help residents across the UAE and GCC apply for visas and get the supporting documents embassies ask for, quickly and without hassle."
        services={pageData.sections.about.services}
      />
      <Benefits
        title={pageData.sections.benefits.title}
        subtitle={pageData.sections.benefits.subtitle}
        benefits={pageData.sections.benefits.benefits}
      />
      <Testimonials
        title={pageData.sections.testimonials.title}
        subtitle={pageData.sections.testimonials.subtitle}
        testimonials={pageData.sections.testimonials.testimonials}
      />
      <Faqs
        title={pageData.sections.faqs.title}
        subtitle={pageData.sections.faqs.subtitle}
        faqs={pageData.sections.faqs.faqs}
      />
      <BlogPosts
        title={pageData.sections.blogs.title}
        subtitle={pageData.sections.blogs.subtitle}
      />
      <Contact email="info@travl.ae" />
    </>
  );
}
