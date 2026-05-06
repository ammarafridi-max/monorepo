'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, ArrowRight, ChevronDown,
  FileText, FolderOpen, BadgeCheck,
  ShieldCheck, CircleDollarSign, Zap,
} from 'lucide-react';
import Container from '../../../components/shared/layout/Container.js';
import { useGetPublicVisas } from '../../hooks/visa/useGetPublicVisas.js';

const VISA_META = {
  schengen:        { flag: '🇪🇺', tagline: 'Visit 27 European countries with a single visa application.' },
  'united-kingdom': { flag: '🇬🇧', tagline: 'Tourism, business, and family visits handled end-to-end.' },
  usa:             { flag: '🇺🇸', tagline: 'B1/B2 visitor visa with full document prep and interview coaching.' },
  canada:          { flag: '🇨🇦', tagline: 'Temporary resident visa for tourism, business, and family visits.' },
  australia:       { flag: '🇦🇺', tagline: 'Subclass 600 tourist visa with thorough document review.' },
  china:           { flag: '🇨🇳', tagline: 'L-category tourist visa for leisure and family travel to China.' },
};

const FAQS = [
  {
    question: 'What documents do I need for a Schengen visa?',
    answer:
      'Core requirements are: a valid passport (min. 3 months validity beyond travel date), Emirates ID, UAE residence visa, 3 months of bank statements, a salary certificate or NOC from your employer, hotel bookings, and a flight reservation. Travl provides the flight reservation and compiles your full document file on your behalf.',
  },
  {
    question: 'How long does the process take?',
    answer:
      'Schengen standard processing is 15 business days from your VFS appointment. Our Express service targets 3–5 business days. UK and USA timelines vary — we give you a clear, honest estimate at the start of your case and update you throughout.',
  },
  {
    question: 'Do you guarantee visa approval?',
    answer:
      'No provider can legally guarantee approval — that decision rests with the embassy. What we guarantee is a thoroughly prepared, error-free file that gives you the best possible chance. Our overall approval rate across all cases is 98%. If your application is refused, our Concierge package includes a free resubmission.',
  },
  {
    question: 'Can you help if my visa was previously rejected?',
    answer:
      'Yes — and this is one of our most common cases. We start by reading your refusal notice in detail to identify exactly what went wrong. Most rejections are fixable with a stronger financial narrative, a better-targeted cover letter, or corrected documents. Many clients get approved on their second application with us.',
  },
  {
    question: "What's included in the service fee?",
    answer:
      "Your Travl fee covers: full document review and compilation, a GDS flight reservation, cover letter preparation, day-by-day itinerary, VFS or embassy appointment guidance, and WhatsApp support throughout processing. Embassy and VFS fees are shown separately and passed through at cost — they're never marked up.",
  },
];

const HOW_IT_WORKS = [
  {
    step:        '01',
    Icon:        FileText,
    title:       'Submit Your Details',
    description: 'Fill out a simple form with your travel plans and passport info. It takes under 5 minutes — no office visit needed.',
  },
  {
    step:        '02',
    Icon:        FolderOpen,
    title:       'We Prepare Your File',
    description: 'Our specialists compile and review every document — cover letter, financials, itinerary, insurance, and more.',
  },
  {
    step:        '03',
    Icon:        BadgeCheck,
    title:       'Get Your Visa',
    description: 'We guide you through submission and track your application all the way to approval. You stay informed at every stage.',
  },
];

const WHY_US = [
  {
    Icon:        ShieldCheck,
    title:       'No Rejection Risk',
    description: 'We review your complete file before submission and flag every issue — so the embassy never has a reason to refuse.',
  },
  {
    Icon:        CircleDollarSign,
    title:       'Transparent Pricing',
    description: 'No hidden fees. Our fee, the embassy fee, and VFS charges are all itemised clearly before you pay anything.',
  },
  {
    Icon:        Zap,
    title:       'Fast Turnaround',
    description: 'Standard, Express, and Concierge processing available. Choose the timeline that fits your travel plans.',
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-gray-100 last:border-0 transition-colors ${open ? '' : 'hover:bg-gray-50/50'}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
      >
        <span className={`font-outfit font-medium text-[14px] leading-snug transition-colors duration-150 ${open ? 'text-primary-700' : 'text-gray-800'}`}>
          {question}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-primary-600' : 'text-gray-400'}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="font-outfit font-light text-[13px] text-gray-600 leading-6 px-5 pb-5">
          {answer}
        </p>
      </div>
    </div>
  );
}

function VisaCard({ visa }) {
  const meta   = VISA_META[visa.slug] ?? {};
  const flag   = meta.flag    ?? '🌍';
  const tagline = meta.tagline ?? visa.heroSubheadline ?? '';
  const fromPrice = visa.packages?.length > 0
    ? Math.min(...visa.packages.map((p) => Number(p.price) || 0))
    : null;

  return (
    <Link
      href={`/visa/${visa.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(16,24,40,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(16,24,40,0.12)] transition-all duration-300"
    >

      <div className="aspect-[16/7] bg-gradient-to-br from-primary-50 to-primary-100/50 flex items-center justify-center overflow-hidden">
        <span className="text-[60px] leading-none select-none" role="img" aria-label={visa.countryName}>
          {flag}
        </span>
      </div>

      <div className="flex flex-col flex-1 py-5 px-5">
        <h3 className="font-outfit font-medium text-[17px] leading-snug text-gray-900 mb-1.5">
          {visa.countryName} Visa
        </h3>
        <p className="font-outfit font-light text-[13px] text-gray-500 leading-5 flex-1 line-clamp-2">
          {tagline}
        </p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          {fromPrice != null && (
            <span className="text-[13px] font-semibold text-primary-700">
              From AED {fromPrice.toLocaleString()}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-600 group-hover:text-accent-700 transition-colors ml-auto">
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
      <div className="aspect-[16/7] bg-gray-100" />
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

      <section className="relative overflow-hidden bg-[linear-gradient(155deg,#f0fbf9_0%,#e8f2ff_48%,#fff8f4_100%)] pt-32 pb-16 md:pt-36 md:pb-20 lg:pt-40 lg:pb-24">

        <div className="pointer-events-none absolute -left-32 -top-20 h-96 w-96 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent-100/40 blur-3xl" />

        <Container className="relative text-center">

          <p className="inline-flex items-center gap-2.5 text-[11px] font-outfit font-bold text-primary-600 uppercase tracking-[0.18em] mb-6">
            <span className="block w-5 h-[1.5px] bg-primary-400 rounded-full" />
            Visa Assistance · Dubai, UAE
            <span className="block w-5 h-[1.5px] bg-primary-400 rounded-full" />
          </p>

          <h1 className="font-outfit font-medium text-[36px] md:text-[50px] lg:text-[58px] text-gray-900 leading-[1.08] tracking-[-0.025em] mb-5 max-w-3xl mx-auto">
            Visa Assistance For<br className="hidden sm:block" /> UAE Residents
          </h1>

          <p className="font-outfit font-light text-[16px] md:text-[18px] text-gray-500 leading-[1.8] max-w-xl mx-auto mb-8">
            Expert document preparation, appointment booking, and end-to-end support. We've helped hundreds of UAE residents get their visa approved — the first time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
            {['500+ Visas Processed', '98% Approval Rate', 'Dedicated Case Manager'].map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-[13px] font-outfit font-medium text-gray-700 shadow-sm"
              >
                <Check size={13} className="text-primary-500 shrink-0" />
                {badge}
              </span>
            ))}
          </div>

          <Link
            href="mailto:info@travl.ae"
            className="inline-flex items-center gap-2 font-outfit font-medium text-[15px] py-3.5 px-7 rounded-xl bg-accent-500 hover:bg-accent-600 text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] hover:-translate-y-0.5 transition-all duration-200"
          >
            Get free consultation <ArrowRight size={15} />
          </Link>
        </Container>
      </section>

      <section className="py-14 md:py-20 bg-white">
        <Container>

          <div className="text-center mb-10">
            <p className="text-[11px] font-outfit font-semibold uppercase tracking-[0.15em] text-primary-600 mb-2">
              Popular destinations
            </p>
            <h2 className="font-outfit font-medium text-[26px] md:text-[32px] text-gray-900 leading-[1.2] tracking-[-0.01em]">
              Where Are You Travelling?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoadingVisas
              ? Array.from({ length: 4 }).map((_, i) => <VisaCardSkeleton key={i} />)
              : visas.map((visa) => <VisaCard key={visa.slug} visa={visa} />)
            }
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-20 bg-[#faf9f7] border-y border-gray-100">
        <Container>
          <div className="text-center mb-12">
            <p className="text-[11px] font-outfit font-semibold uppercase tracking-[0.15em] text-primary-600 mb-2">
              Simple process
            </p>
            <h2 className="font-outfit font-medium text-[26px] md:text-[32px] text-gray-900 leading-[1.2] tracking-[-0.01em]">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {HOW_IT_WORKS.map(({ step, Icon, title, description }, index) => (
              <div key={step} className="flex flex-col items-center text-center relative">

                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-9 left-[calc(50%+44px)] right-[calc(-50%+44px)] h-px bg-gray-200 z-0" />
                )}

                <div className="relative z-10 w-[72px] h-[72px] rounded-2xl bg-primary-700 text-white flex items-center justify-center mb-5 shadow-[0_8px_24px_rgba(15,52,96,0.2)]">
                  <Icon size={28} />
                </div>
                <p className="text-[10px] font-outfit font-bold text-primary-400 uppercase tracking-[0.22em] mb-2">
                  Step {step}
                </p>
                <h3 className="font-outfit font-medium text-[17px] text-gray-900 mb-2 leading-snug">
                  {title}
                </h3>
                <p className="font-outfit font-light text-[13px] text-gray-500 leading-6 max-w-[220px]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-20 bg-white">
        <Container>
          <div className="text-center mb-10">
            <p className="text-[11px] font-outfit font-semibold uppercase tracking-[0.15em] text-primary-600 mb-2">
              Why Travl
            </p>
            <h2 className="font-outfit font-medium text-[26px] md:text-[32px] text-gray-900 leading-[1.2] tracking-[-0.01em]">
              Why Choose Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {WHY_US.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-7 shadow-[0_2px_12px_rgba(16,24,40,0.05)]"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-5">
                  <Icon size={20} className="text-primary-700" />
                </div>
                <h3 className="font-outfit font-medium text-[17px] text-gray-900 mb-2 leading-snug">
                  {title}
                </h3>
                <p className="font-outfit font-light text-[13px] text-gray-500 leading-6">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-20 bg-[#faf8f5] border-y border-[#ede9e3]">
        <Container>
          <div className="text-center mb-10">
            <p className="text-[11px] font-outfit font-semibold uppercase tracking-[0.15em] text-primary-600 mb-2">
              Have questions?
            </p>
            <h2 className="font-outfit font-medium text-[26px] md:text-[32px] text-gray-900 leading-[1.2] tracking-[-0.01em] mb-2">
              Frequently Asked Questions
            </h2>
            <p className="font-outfit font-light text-[14px] text-gray-500 leading-relaxed">
              Still have questions?{' '}
              <a
                href="mailto:info@travl.ae"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Email us
              </a>{' '}
              — our specialists respond within minutes.
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200/80 bg-white shadow-[0_2px_12px_rgba(16,24,40,0.05)] overflow-hidden">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-20 bg-white">
        <Container>
          <div className="rounded-2xl bg-gradient-to-br from-primary-800 to-primary-950 px-8 py-12 md:px-14 md:py-14 text-center relative overflow-hidden">

            <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -left-10 -bottom-12 w-48 h-48 rounded-full bg-accent-500/10" />

            <div className="relative">
              <p className="font-outfit font-medium text-[24px] md:text-[30px] text-white mb-3 leading-snug">
                Don&rsquo;t see your destination?
              </p>
              <p className="font-outfit font-light text-[15px] text-white/65 mb-8 max-w-md mx-auto leading-relaxed">
                We assist with many more countries not listed here. Our specialists will advise on requirements, timelines, and next steps — usually within minutes.
              </p>
              <Link
                href="mailto:info@travl.ae"
                className="inline-flex items-center gap-2 font-outfit font-medium text-[14px] py-3 px-6 rounded-xl bg-accent-500 hover:bg-accent-600 text-white border border-accent-500 transition-colors duration-200"
              >
                Ask About Another Country <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
