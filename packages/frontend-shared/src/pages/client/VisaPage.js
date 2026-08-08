"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  ShieldCheck,
  CircleDollarSign,
  Zap,
} from "lucide-react";
import Container from "../../components/shared/layout/Container.js";
import PrimarySection from "../../components/shared/layout/PrimarySection.js";
import Hero from "../../components/sections/v2/Hero.js";
import HowItWorks from "../../components/sections/v2/HowItWorks.js";
import Benefits from "../../components/sections/v2/Benefits.js";
import Faqs from "../../components/sections/v2/Faqs.js";
import { useGetPublicVisas } from "../../hooks/visa/useGetPublicVisas.js";

const VISA_META = {
  schengen: {
    flag: "🇪🇺",
    tagline: "Visit 29 European countries with a single visa application.",
  },
  "united-kingdom": {
    flag: "🇬🇧",
    tagline: "Tourism, business, and family visits handled end-to-end.",
  },
  usa: {
    flag: "🇺🇸",
    tagline:
      "B1/B2 visitor visa with full document prep and interview coaching.",
  },
  canada: {
    flag: "🇨🇦",
    tagline:
      "Temporary resident visa for tourism, business, and family visits.",
  },
  australia: {
    flag: "🇦🇺",
    tagline: "Subclass 600 tourist visa with thorough document review.",
  },
  china: {
    flag: "🇨🇳",
    tagline: "L-category tourist visa for leisure and family travel to China.",
  },
};

const HOW_IT_WORKS = [
  {
    title: "Submit Your Details",
    text: "Fill out a simple form with your travel plans and passport info. It takes under 5 minutes, with no office visit needed.",
  },
  {
    title: "We Prepare Your File",
    text: "Our specialists compile and review every document: cover letter, financials, itinerary, insurance, and more.",
  },
  {
    title: "Get Your Visa",
    text: "We guide you through submission and track your application all the way to approval. You stay informed at every stage.",
  },
];

const WHY_US = [
  {
    icon: ShieldCheck,
    title: "No Rejection Risk",
    text: "We review your complete file before submission and flag every issue, so the embassy never has a reason to refuse.",
  },
  {
    icon: CircleDollarSign,
    title: "Transparent Pricing",
    text: "No hidden fees. Our fee, the embassy fee, and VFS charges are all itemised clearly before you pay anything.",
  },
  {
    icon: Zap,
    title: "Fast Turnaround",
    text: "Standard, Express, and Concierge processing available. Choose the timeline that fits your travel plans.",
  },
];

const FAQS = [
  {
    question: "What documents do I need for a Schengen visa?",
    answer:
      "Core requirements are: a valid passport (min. 3 months validity beyond travel date), Emirates ID, UAE residence visa, 3 months of bank statements, a salary certificate or NOC from your employer, hotel bookings, and a flight reservation. Travl provides the flight reservation and compiles your full document file on your behalf.",
  },
  {
    question: "How long does the process take?",
    answer:
      "Schengen standard processing is 15 business days from your VFS appointment. Our Express service targets 3 to 5 business days. UK and USA timelines vary, and we give you a clear, honest estimate at the start of your case and update you throughout.",
  },
  {
    question: "Do you guarantee visa approval?",
    answer:
      "No provider can legally guarantee approval, as that decision rests with the embassy. What we guarantee is a thoroughly prepared, error-free file that gives you the best possible chance. Our overall approval rate across all cases is 98%. If your application is refused, our Concierge package includes a free resubmission.",
  },
  {
    question: "Can you help if my visa was previously rejected?",
    answer:
      "Yes, and this is one of our most common cases. We start by reading your refusal notice in detail to identify exactly what went wrong. Most rejections are fixable with a stronger financial narrative, a better-targeted cover letter, or corrected documents. Many clients get approved on their second application with us.",
  },
  {
    question: "What is included in the service fee?",
    answer:
      "Your Travl fee covers: full document review and compilation, a GDS flight reservation, cover letter preparation, a day-by-day itinerary, VFS or embassy appointment guidance, and WhatsApp support throughout processing. Embassy and VFS fees are shown separately and passed through at cost, never marked up.",
  },
];

function ConsultationCard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">
          Free Consultation
        </span>
        <h2 className="text-2xl font-bold text-gray-900 leading-snug">
          Not sure where to start?
        </h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Tell us your destination and travel plans. Our specialists reply
          within minutes with the requirements, the timeline, and a clear,
          itemised quote.
        </p>
      </div>
      <Link
        href="mailto:info@travl.ae"
        className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm py-3.5 px-6 rounded-xl transition-colors"
      >
        Get free consultation <ArrowRight size={16} />
      </Link>
      <p className="text-xs text-gray-400 text-center">
        No obligation. We reply within minutes during business hours.
      </p>
    </div>
  );
}

const CARD_FEATURES = [
  "Full document review and file preparation",
  "VFS or embassy appointment booking",
  "Cover letter, itinerary, and flight reservation",
];

function VisaCard({ visa }) {
  const meta = VISA_META[visa.slug] ?? {};
  // Editors control this from the admin excerpt field; the hardcoded copy
  // below is only a fallback for pages written before the field existed.
  const tagline = visa.excerpt || meta.tagline || visa.heroSubheadline || "";
  const cheapest = (visa.packages ?? []).reduce(
    (min, p) =>
      min == null || (Number(p.price) || 0) < (Number(min.price) || 0)
        ? p
        : min,
    null,
  );
  const fromPrice = cheapest ? Number(cheapest.price) || 0 : null;
  const timeline = cheapest?.timeline ?? null;

  return (
    <Link
      href={`/visa/${visa.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(16,24,40,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(16,24,40,0.12)] transition-all duration-300"
    >
      <div className="relative aspect-16/7 bg-linear-to-br from-primary-50 to-primary-100/50 overflow-hidden">
        {visa.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visa.heroImageUrl}
            alt={`${visa.countryName} visa`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col flex-1 py-5 px-5">
        <h3 className="font-semibold text-[17px] leading-snug text-gray-900 mb-1.5">
          {visa.countryName} Visa
        </h3>
        <p className="text-[13px] text-gray-500 leading-5">{tagline}</p>

        <ul className="mt-4 flex flex-col gap-2 flex-1">
          {CARD_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-[12.5px] text-gray-600 leading-snug"
            >
              <Check size={14} className="text-primary-600 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {timeline && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
            <Clock size={13} className="text-primary-500 shrink-0" />
            Approx. {timeline}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-4 border-t border-gray-100">
          {fromPrice != null && (
            <span className="text-[13px] font-semibold text-primary-700">
              From AED {fromPrice.toLocaleString()}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-700 group-hover:text-primary-800 transition-colors ml-auto">
            Learn more <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function VisaCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(16,24,40,0.06)] animate-pulse">
      <div className="aspect-16/7 bg-gray-100" />
      <div className="py-5 px-5 flex flex-col gap-3">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-4/5" />
        <div className="h-px bg-gray-100 mt-2" />
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export default function VisaPage({ schema, breadcrumbJsonLd }) {
  const { visas, isLoadingVisas } = useGetPublicVisas();

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}

      <Hero
        title="Visa Assistance for UAE Residents"
        text="Expert document preparation, appointment booking, and end-to-end support. We have helped hundreds of UAE residents get their visa approved the first time."
        pills={[
          "500+ Visas Processed",
          "98% Approval Rate",
          "Dedicated Case Manager",
        ]}
        breadcrumbPaths={[
          { label: "Home", path: "/" },
          { label: "Visa", path: "/visa" },
        ]}
        form={<ConsultationCard />}
      />

      <PrimarySection className="bg-white py-20">
        <Container>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold">
              Where Are You Travelling?
            </h2>
            <p className="text-gray-500 mt-3">
              Choose your destination and we will handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoadingVisas
              ? Array.from({ length: 4 }).map((_, i) => (
                  <VisaCardSkeleton key={i} />
                ))
              : visas.map((visa) => <VisaCard key={visa.slug} visa={visa} />)}
          </div>
        </Container>
      </PrimarySection>

      <HowItWorks
        title="How It Works"
        subtitle="From your first form to visa approval, in three simple steps."
        steps={HOW_IT_WORKS}
      />

      <Benefits
        title="Why Choose Us"
        subtitle="Document preparation done properly, so the embassy never has a reason to say no."
        benefits={WHY_US}
      />

      <Faqs
        title="Frequently Asked Questions"
        subtitle="Everything UAE residents ask us before starting a visa application."
        faqs={FAQS}
      />

      <PrimarySection className="bg-primary-700 text-white py-20">
        <Container className="max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Don&rsquo;t see your destination?
          </h2>
          <p className="mt-4 text-primary-200 text-lg">
            We assist with many more countries not listed here. Our specialists
            will advise on requirements, timelines, and next steps, usually
            within minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="mailto:info@travl.ae"
              className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-bold px-8 py-4 rounded-full text-sm transition-colors"
            >
              Ask About Another Country <ArrowRight size={15} />
            </Link>
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
