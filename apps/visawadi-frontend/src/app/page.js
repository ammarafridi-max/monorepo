import { Globe, Headphones } from "lucide-react";
import { MdOutlineFactCheck } from "react-icons/md";
import { getPublicVisasApi } from "@travel-suite/frontend-shared/services/apiVisa";
import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import Destinations from "@/components/home/Destinations";
import HowItWorks from "@/components/home/HowItWorks";
import WhyVisaWadi from "@/components/home/WhyVisaWadi";
import Testimonials from "@/components/home/Testimonials";
import Faqs from "@/components/home/Faqs";
import BlogPreview from "@/components/home/BlogPreview";
import FinalCta from "@/components/home/FinalCta";
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
import { EMAIL, WHATSAPP_URL } from "@/config/contact";
import { DEFAULT_COUNTRY } from "@/config/countries";
import { TRUST_ASSURANCES, TRUST_SUBTITLE } from "@/config/trust";

const DIRECTORY = `/${DEFAULT_COUNTRY.slug}`;

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

const WHY_US = [
  {
    icon: Globe,
    title: "Schengen, UK, US and Canada",
    text: "Application support for the destinations UAE residents apply to most, including France, Germany, Italy and Spain individually.",
  },
  {
    icon: Headphones,
    title: "Average Response Time 10 Minutes",
    text: "Message us during business hours and you will hear back in about ten minutes on average. Outside them, within the hour.",
  },
  {
    icon: MdOutlineFactCheck,
    title: "Embassy-Accepted Formats",
    text: "Everything we prepare is formatted to meet the requirements of embassies, VFS Global and BLS International.",
  },
];

const pageData = {
  meta: {
    title: "Schengen, UK, US & Canada Visa Help for UAE Residents",
    description:
      "Schengen, UK, US and Canada visas from AED 299. We check every document against embassy requirements and book your VFS appointment. Free consultation first.",
    canonical: SITE_URL,
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

const DESTINATION_ORDER = [
  "schengen",
  "united-kingdom",
  "usa",
  "canada",
  "saudi-arabia",
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

function featuredTestimonials(visas, limit = 3) {
  const seen = new Set();
  const picked = [];
  for (const visa of visas) {
    for (const t of visa.testimonials ?? []) {
      if (!t?.isFeatured || !t.quote || !t.name) continue;
      const key = t.quote.trim().slice(0, 60).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(t);
      if (picked.length === limit) return picked;
    }
  }
  return picked;
}

export default async function HomePage() {
  const visas = await getPublicVisasApi().catch(() => []);
  const all = Array.isArray(visas) ? visas : visas?.visas || [];
  const ordered = orderDestinations(all);
  const list = ordered.slice(0, 6);

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
      offers: list
        .map((v) => {
          const cheapest = (v.packages ?? []).reduce(
            (min, p) =>
              min == null || Number(p.price) < Number(min.price) ? p : min,
            null,
          );
          return cheapest
            ? { ...cheapest, name: `${v.countryName} visa assistance` }
            : null;
        })
        .filter(Boolean),
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
        title="Visa assistance for UAE residents, made simple"
        lede="Most refusals come from document errors that were preventable. Our Dubai specialists build your application and check every page before it goes in. Packages from AED 299."
        primary={{ label: "See visa packages", href: DIRECTORY }}
        secondary={{ label: "How it works", href: "#how-it-works" }}
        note="Free to check. No account needed."
        quickLinks={list.slice(0, 4).map((v) => ({
          label: v.countryName,
          href: `${DIRECTORY}/visa/${v.slug}`,
        }))}
      />

      <TrustStrip items={TRUST_ASSURANCES} caption={TRUST_SUBTITLE} />

      <Destinations
        visas={list}
        basePath={DIRECTORY}
        allHref={DIRECTORY}
        heading="Visas We Handle"
        description="Full application support for the destinations UAE residents apply to most. Every package includes document review, file preparation and appointment booking."
      />

      <HowItWorks
        heading="How It Works"
        description="Three steps from first consultation to a decision, with a specialist on your file throughout."
        steps={HOW_IT_WORKS}
      />

      <WhyVisaWadi
        heading="Why UAE Residents Choose VisaWadi"
        description="A Dubai-based team that does visa applications, and only visa applications."
        intro="VisaWadi helps residents across the UAE and GCC apply for visas. We prepare the documents embassies ask for, check them before submission, and stay with the application until there is a decision."
        items={WHY_US}
      />

      <Testimonials
        heading="What Our Clients Say"
        description="Feedback from people who applied with us, quoted as written."
        testimonials={featuredTestimonials(ordered)}
      />

      <Faqs
        heading="Frequently Asked Questions"
        description="Common questions about our service, timelines, and what your application needs."
        faqs={homepageFaqs}
        allHref="/faq"
      />

      <BlogPreview
        heading="From the Blog"
        description="Guides on visa applications and travel documents for UAE residents."
      />

      <FinalCta
        heading="Still Have Questions?"
        text="Tell us where you are going and what you are applying for. A specialist will tell you what your file needs, before you commit to anything."
        primary={{ label: "Find your visa", href: DIRECTORY }}
        secondary={
          WHATSAPP_URL
            ? { label: "Chat on WhatsApp", href: WHATSAPP_URL, external: true }
            : { label: `Email ${EMAIL}`, href: `mailto:${EMAIL}` }
        }
      />
    </>
  );
}
