import Link from "next/link";
import Hero from "@travel-suite/frontend-shared/components/sections/v2/Hero";
import HowItWorks from "@travel-suite/frontend-shared/components/sections/v2/HowItWorks";
import About from "@travel-suite/frontend-shared/components/sections/v2/About";
import Benefits from "@travel-suite/frontend-shared/components/sections/v2/Benefits";
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
import { EMAIL } from "@/config/contact";
import {
  ArrowRight,
  FileCheck,
  Globe,
  Headphones,
  Banknote,
  Stamp,
  Check,
} from "lucide-react";
import { MdOutlineTravelExplore, MdOutlineFactCheck } from "react-icons/md";

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
    text: "Message us during business hours and you will usually hear back within three minutes. Outside them, within the hour.",
  },
  {
    icon: Stamp,
    title: "Refusals Reanalysed",
    text: "Been refused before? We start with the refusal notice, work out the exact grounds, and rebuild the file around them.",
  },
  {
    icon: MdOutlineFactCheck,
    title: "Embassy-Accepted Formats",
    text: "Everything we prepare is formatted to meet the requirements of embassies, VFS Global and BLS International.",
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
    title: "Visa Assistance for UAE Residents | VisaWadi",
    description:
      "Expert visa application support for UAE residents. Schengen, UK, US and Canada. Document review, appointment booking and full file preparation from AED 299.",
    canonical: SITE_URL,
  },
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

// Lead with demand rather than the alphabetical order the API returns.
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
  return [...visas].sort(
    (a, b) => rank(a) - rank(b) || a.countryName.localeCompare(b.countryName),
  );
}

/** Hero panel. Replaces the insurance quote form the shared Hero defaults to. */
function VisaConsultCard() {
  const included = [
    "Document review against current embassy rules",
    "Cover letter and financial summary written for you",
    "VFS or BLS appointment booked on your behalf",
    "Tracked until your passport comes back",
  ];

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
        Free consultation
      </p>
      <p className="mt-2 text-xl font-bold leading-snug text-gray-900">
        Find out what your application needs
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Tell us where you are going and we will tell you exactly what to prepare.
        No obligation.
      </p>

      <ul className="mt-5 flex flex-col gap-2.5">
        {included.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-[13px] leading-snug text-gray-600"
          >
            <Check size={14} className="mt-0.5 shrink-0 text-primary-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href="/visa"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          Get free consultation <ArrowRight size={15} />
        </Link>
        <a
          href={`mailto:${EMAIL}`}
          className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-primary-300 hover:text-primary-700"
        >
          Email us
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Packages from AED 299. Embassy fees passed through at cost.
      </p>
    </div>
  );
}

function VisaDestinations({ visas }) {
  if (!visas.length) return null;

  return (
    <PrimarySection className="py-14 md:py-20">
      <Container>
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Visas We Handle
          </h2>
          <p className="mt-3 leading-relaxed text-gray-500">
            Full application support for the destinations UAE residents apply to
            most. Every package includes document review, file preparation and
            appointment booking.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visas.map((visa) => (
            <VisaCard key={visa.slug} visa={visa} />
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/visa"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
          >
            See all destinations <ArrowRight size={15} />
          </Link>
        </div>
      </Container>
    </PrimarySection>
  );
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
        form={<VisaConsultCard />}
      />
      <VisaDestinations visas={list} />
      <HowItWorks
        title="How It Works"
        subtitle="Three steps from first consultation to a decision, with a specialist on your file throughout"
        steps={HOW_IT_WORKS}
      />
      <About
        title="About Us"
        text="VisaWadi helps residents across the UAE and GCC apply for visas. We prepare the documents embassies ask for, check them before submission, and stay with the application until there is a decision."
        services={[
          {
            icon: <MdOutlineTravelExplore />,
            title: "Visa Assistance",
            description:
              "Application support for Schengen, UK, US and Canada, plus France, Germany, Italy and Spain individually. We review your documents, prepare the full file, book your appointment and track the application until a decision is made. Packages from AED 299.",
          },
        ]}
      />
      <Benefits
        title="Why UAE Residents Choose VisaWadi"
        subtitle="A Dubai-based team that does visa applications, and only visa applications"
        benefits={benefits}
      />
      <Faqs
        title="Frequently Asked Questions"
        subtitle="Common questions about our service, timelines, and what your application needs"
        faqs={homepageFaqs}
      />
      <BlogPosts
        title="From the Blog"
        subtitle="Guides on visa applications and travel documents for UAE residents"
      />
      <Contact email={EMAIL} />
    </>
  );
}
