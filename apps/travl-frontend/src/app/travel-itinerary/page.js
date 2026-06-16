import Link from 'next/link';
import { Check } from 'lucide-react';
import {
  MdOutlineMap,
  MdOutlineDescription,
  MdOutlineVerifiedUser,
} from 'react-icons/md';
import {
  FileCheck,
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  SlidersHorizontal,
} from 'lucide-react';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import Hero from '@travel-suite/frontend-shared/components/sections/v2/Hero';
import HowItWorks from '@travel-suite/frontend-shared/components/sections/v2/HowItWorks';
import About from '@travel-suite/frontend-shared/components/sections/v2/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v2/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v2/Testimonials';
import Faqs from '@travel-suite/frontend-shared/components/sections/v2/Faqs';
import {
  buildMetadata,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

const FORM_PATH = '/itinerary-booking/form';

export const processSteps = [
  {
    title: 'Enter Your Trip Details',
    text: 'Add your travel dates, arrival and departure cities, the country you are applying to, your purpose of travel, and any other countries on your trip. Everything is entered manually — no account needed.',
  },
  {
    title: 'Generate & Preview',
    text: 'We instantly build a professional, day-by-day itinerary tailored to your visa country and purpose. You review a watermarked preview before paying anything — and can regenerate it if you want changes.',
  },
  {
    title: 'Pay & Download',
    text: 'Pay a one-time AED 49 and immediately download a clean, print-ready PDF — formatted to submit with your visa application at the embassy, VFS, or BLS.',
  },
];

const benefits = [
  {
    icon: FileCheck,
    title: 'Embassy-Ready Format',
    text: 'A clear, professional day-by-day plan laid out the way visa officers expect to see it — dates, cities, and daily intent at a glance.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Tailored to Your Visa',
    text: 'The itinerary is shaped by the country you are applying to and your purpose of travel, so the emphasis matches your application.',
  },
  {
    icon: Lock,
    title: 'Preview Before You Pay',
    text: 'See a full watermarked preview of your itinerary first. You only pay once you are happy with it — no surprises.',
  },
  {
    icon: Zap,
    title: 'Ready in Minutes',
    text: 'No back-and-forth and no waiting. Generate, review, pay, and download your print-ready PDF in a single sitting.',
  },
  {
    icon: ShieldCheck,
    title: 'Consistent & Accurate',
    text: 'Every itinerary is automatically checked so the dates, cities, and country order always line up — no contradictory documents.',
  },
  {
    icon: Globe2,
    title: 'Multi-Country Trips',
    text: 'Visiting more than one country? Add them in order and we build a coherent route from your arrival city to your departure city.',
  },
];

const testimonials = [
  {
    quote:
      'I needed a day-by-day plan for my Schengen application and had no idea how to format it. Travl generated exactly what the embassy wanted in a couple of minutes.',
    name: 'Ayesha R.',
    location: 'Dubai, UAE',
    stars: 5,
    plan: 'Tourism Itinerary',
  },
  {
    quote:
      'The preview-before-pay was great — I regenerated once to adjust my cities, then downloaded the PDF. Accepted at VFS without any questions.',
    name: 'Daniel K.',
    location: 'Abu Dhabi, UAE',
    stars: 5,
    plan: 'Business Itinerary',
  },
  {
    quote:
      'Clean, professional, and tailored to my trip across three countries. Far easier than trying to build a plan myself in a document.',
    name: 'Priya N.',
    location: 'Sharjah, UAE',
    stars: 5,
    plan: 'Multi-Country Itinerary',
  },
];

export const faqs = [
  {
    question: 'What is a travel itinerary for a visa application?',
    answer:
      'It is a professional, day-by-day plan of your trip — dates, cities, and daily activities — that many embassies ask for as proof of your travel intentions. Our generator formats it the way visa officers expect to see it.',
  },
  {
    question: 'Is this a real booking or a reservation?',
    answer:
      'No. It is a proposed travel itinerary document for your visa application. It does not book or reserve any flights or hotels, and it never invents flight numbers or hotel names — it only references the cities and dates you provide.',
  },
  {
    question: 'Can I see the itinerary before paying?',
    answer:
      'Yes. After you generate it, you see a full watermarked preview. You only pay the one-time AED 49 once you are happy with it, and the clean, watermark-free PDF unlocks immediately after payment.',
  },
  {
    question: 'Is it tailored to the country I am applying to?',
    answer:
      'Yes. The itinerary is shaped by the country you are applying to and your purpose of travel — tourism, business, family visit, and so on — so the emphasis and format match your application.',
  },
  {
    question: 'Can I make changes after generating?',
    answer:
      'You can regenerate the itinerary before payment if you want a different plan. After payment, you have a short window of free edits before a paid revision is needed.',
  },
  {
    question: 'How quickly do I get my itinerary?',
    answer:
      'Immediately. The itinerary is generated in minutes, and the print-ready PDF is available to download the moment your payment is confirmed.',
  },
];

export const pageData = {
  meta: {
    title: 'Travel Itinerary Generator for Visa Applications | Travl',
    description:
      'Generate an embassy-ready, day-by-day travel itinerary for your visa application. Tailored to your country and purpose, preview before you pay, print-ready PDF from AED 49.',
    canonical: 'https://www.travl.ae/travel-itinerary',
  },
  hero: {
    title: 'Embassy-Ready Travel Itineraries for Your Visa',
    text: 'Generate a professional, day-by-day travel itinerary tailored to your visa country and purpose. Preview it free, then download a print-ready PDF to submit with your application.',
    pills: ['Embassy-Accepted Format', 'Preview Before You Pay', 'Tailored to Your Visa', 'Ready in Minutes'],
  },
  about: {
    title: 'About Our Itinerary Generator',
    text: 'We help UAE residents and travellers produce clean, professional travel itineraries for visa applications. You enter your trip details, we build and validate a day-by-day plan tailored to your destination, and you download a print-ready document — without booking or paying for flights and hotels you do not need.',
    services: [
      {
        icon: <MdOutlineMap />,
        title: 'Day-by-Day Itinerary',
        description:
          'A complete daily plan from your arrival city to your departure city, with dates, locations, and activities laid out the way embassies expect.',
      },
      {
        icon: <MdOutlineDescription />,
        title: 'Print-Ready PDF',
        description:
          'A clean, professional, watermark-free PDF delivered instantly after payment — ready to submit at the embassy, VFS, or BLS. From AED 49.',
      },
      {
        icon: <MdOutlineVerifiedUser />,
        title: 'Tailored & Validated',
        description:
          'Every itinerary is shaped by your visa country and purpose, and automatically checked so the dates, cities, and country order are always consistent.',
      },
    ],
  },
};

export const metadata = buildMetadata(pageData.meta);

function HeroCta() {
  const points = [
    'Tailored to your visa country & purpose',
    'Watermarked preview before you pay',
    'Clean, print-ready PDF — no flights or hotels booked',
  ];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="text-xs font-semibold text-primary-700 bg-primary-50 rounded-full px-3 py-1">
          Visa itinerary
        </span>
        <h2 className="mt-4 text-xl font-bold text-gray-900">Your day-by-day plan, ready to submit</h2>
        <p className="mt-1 text-sm text-gray-500">
          <span className="text-2xl font-bold text-gray-900">AED 49</span> · one-time
        </p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-gray-700">
            <Check size={16} className="mt-0.5 shrink-0 text-primary-600" />
            {p}
          </li>
        ))}
      </ul>
      <Link
        href={FORM_PATH}
        className="flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
      >
        Generate my itinerary
      </Link>
      <p className="text-xs text-gray-400 text-center">No account needed. You only pay when you are happy with the preview.</p>
    </div>
  );
}

export default function Page() {
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(pageData.meta),
    buildService({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      areaServed: 'AE',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'Travel Itinerary Generator FAQ',
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
        title={pageData.hero.title}
        text={pageData.hero.text}
        pills={pageData.hero.pills}
        form={<HeroCta />}
        breadcrumbPaths={[
          { label: 'Home', path: '/' },
          { label: 'Travel Itinerary', path: '/travel-itinerary' },
        ]}
      />
      <HowItWorks
        title="How It Works"
        subtitle="From trip details to a print-ready itinerary in 3 steps"
        steps={processSteps}
      />
      <About
        title={pageData.about.title}
        text={pageData.about.text}
        services={pageData.about.services}
      />
      <Benefits
        title="Why Use Our Itinerary Generator?"
        subtitle="Built for visa applications, trusted by UAE travellers"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from travellers who used Travl for their visa documents"
        testimonials={testimonials}
      />
      <PrimarySection className="py-14 md:py-18 lg:py-24">
        <Container className="rounded-3xl border border-primary-100 bg-[linear-gradient(145deg,#f5fbfb_0%,#eff7ff_55%,#fff7f0_100%)] p-8 md:p-10 text-center">
          <SectionTitle textAlign="center" className="mb-4">
            Ready to Generate Your Visa Itinerary?
          </SectionTitle>
          <p className="text-[16px] md:text-[18px] text-gray-700 font-light leading-7 max-w-[760px] mx-auto">
            Enter your trip details, preview your day-by-day plan for free, and download a clean,
            embassy-ready PDF in minutes — all for a one-time AED 49.
          </p>
          <Link
            href={FORM_PATH}
            className="inline-flex items-center justify-center mt-7 bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm px-8 py-4 rounded-full transition-colors"
          >
            Generate my itinerary
          </Link>
        </Container>
      </PrimarySection>
      <Faqs
        title="Travel Itinerary — Frequently Asked Questions"
        subtitle="Common questions about generating an itinerary for your visa application"
        faqs={faqs}
      />
    </>
  );
}
