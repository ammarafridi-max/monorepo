import Link from 'next/link';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineHotel } from 'react-icons/md';
import { Plane, Calendar, FileCheck, ShieldCheck, BadgeCheck, Zap } from 'lucide-react';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import About from '@travel-suite/frontend-shared/components/sections/v2/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v2/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v2/Testimonials';
import Faqs from '@travel-suite/frontend-shared/components/sections/v2/Faqs';
import Hero from '@travel-suite/frontend-shared/components/sections/v2/Hero';
import HowItWorks from '@travel-suite/frontend-shared/components/sections/v2/HowItWorks';
import { buildMetadata } from '@/lib/schema';
import {
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

export const processSteps = [
  {
    title: 'Enter Your Trip Details',
    text: 'Select your departure and return dates, destination region, and number of travelers. Your single trip policy will be valid for exactly the dates you enter.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued correctly.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Complete your payment securely online and receive your single trip travel insurance policy by email within minutes. It is ready to download immediately for visa submission or travel.',
  },
];

const testimonials = [
  {
    quote: 'Needed a one-time policy for my holiday to Spain. Ordered it in minutes and received it instantly. My Schengen visa was approved without any problems.',
    name: 'Sandra T.',
    location: 'Dubai, UAE',
    stars: 5,
    plan: 'Single Trip',
  },
  {
    quote: 'The single trip policy was exactly what I needed for my UK visa application. It was accepted by the embassy and the whole process took less than 10 minutes.',
    name: 'Hassan A.',
    location: 'Abu Dhabi, UAE',
    stars: 5,
    plan: 'Single Trip',
  },
  {
    quote: 'Simple, fast, and affordable. I only travel once or twice a year so a single trip policy makes perfect sense. Will definitely use Travl again.',
    name: 'Nina W.',
    location: 'Sharjah, UAE',
    stars: 5,
    plan: 'Single Trip',
  },
];

const benefits = [
  {
    icon: Plane,
    title: 'Coverage for One Journey',
    text: 'A single trip policy covers you from the day you leave the UAE to the day you return. There is no annual commitment and no unused coverage after your trip ends.',
  },
  {
    icon: Calendar,
    title: 'Pay Only for Your Trip Dates',
    text: 'You choose the exact start and end dates, so you only pay for the days you need. Shorter trips cost less than longer ones.',
  },
  {
    icon: FileCheck,
    title: 'One-Time Travel Insurance for Visa Applications',
    text: 'Single trip policies are accepted for visa applications including Schengen, UK, Canada, and other destinations that require proof of travel insurance.',
  },
  {
    icon: ShieldCheck,
    title: 'Schengen-Compliant Cover',
    text: 'Our single trip plans include the medical coverage required for Schengen visa applications and are accepted by European embassies, VFS, and BLS centers across the UAE.',
  },
  {
    icon: BadgeCheck,
    title: 'Issued by AXA',
    text: 'Every policy is underwritten and issued by AXA. Your certificate is genuine and valid for embassy submissions and actual medical emergencies during your trip.',
  },
  {
    icon: Zap,
    title: 'Instant Policy Delivery',
    text: 'Pay online and receive your single trip insurance certificate by email straight away. No waiting period and no office visit required.',
  },
];

export const faqs = [
  {
    question: 'What is single trip travel insurance?',
    answer:
      'Single trip travel insurance covers one specific journey between a set departure date and return date. It is designed for travelers who do not travel frequently enough to need an annual plan.',
  },
  {
    question: 'Is single trip insurance accepted for a Schengen visa?',
    answer:
      'Yes. Our single trip plans are Schengen-compliant and accepted by European embassies, VFS Global, and BLS International centers in the UAE.',
  },
  {
    question: 'What does short trip insurance include?',
    answer:
      'Coverage typically includes emergency medical treatment, hospitalisation, trip cancellations, baggage loss, travel delays, and medical repatriation. The exact scope depends on the plan you choose.',
  },
  {
    question: 'When should I choose single trip over annual travel insurance?',
    answer:
      'If you travel once or twice a year, a single trip policy is usually the more cost-effective choice. If you travel three or more times a year, an annual multi-trip plan often works out cheaper overall.',
  },
  {
    question: 'How quickly will I receive my single trip policy?',
    answer:
      'Your single trip insurance policy is issued instantly and delivered to your email within minutes of successful payment. No office visit is required.',
  },
];

export const pageData = {
  meta: {
    title: 'Single Trip Travel Insurance for UAE Residents | Travl',
    description:
      'Buy single trip travel insurance online in UAE. One-time coverage for your journey, Schengen compliant, issued by AXA. Get your policy instantly at Travl.',
    canonical: 'https://www.travl.ae/travel-insurance/single-trip',
  },
  sections: {
    hero: {
      title: 'Single Trip Travel Insurance for UAE Residents',
      subtitle: 'Pay Only for Your Travel Dates',
      text: 'Single trip travel insurance covers one specific journey, from your departure date to your return. It is the simplest way to get the coverage you need, whether you are applying for a visa or just want protection during your trip. Policies are issued by AXA and delivered instantly after payment.',
      pills: ['Single Journey Cover', 'Flexible Dates', 'Issued by AXA', 'Instant Delivery'],
    },
    process: {
      title: 'How to Get Single Trip Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our Single Trip Insurance',
      text: 'We provide single trip travel insurance for UAE residents through AXA. Each policy covers one journey between your chosen travel dates, with no commitment beyond that trip. Whether you need coverage for a visa application or want to travel with proper protection in place, you can get your policy entirely online and receive it within minutes of payment.',
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Single Trip Insurance',
          description:
            'AXA-issued coverage for one journey between your chosen travel dates. Schengen-compliant, no annual commitment — pay only for the days you travel.',
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Flight Itineraries',
          description:
            'Verifiable flight reservations with a real PNR code. Accepted by VFS, BLS, and embassies — the ideal companion to your single trip insurance for a visa application. From AED 49.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'We provide hotel reservations by email, formatted to meet embassy requirements. A quick and easy way to complete your visa documentation.',
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
      areaServed: 'AE',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'Single Trip Travel Insurance FAQ',
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
          { label: 'Home', path: '/' },
          { label: 'Travel Insurance', path: '/travel-insurance' },
          { label: 'Single Trip', path: '/travel-insurance/single-trip' },
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
        title="Why UAE Residents Choose Our Single Trip Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for single trip insurance"
        testimonials={testimonials}
      />
      <Faqs
        title="Single Trip Insurance — Frequently Asked Questions"
        subtitle="Common questions about one-time travel coverage and how it works"
        faqs={faqs}
      />
      <PrimarySection className="py-10 lg:py-14">
        <Container>
          <SectionTitle textAlign="center" className="mb-6">
            Other Travel Insurance Plans
          </SectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'Schengen Visa Insurance', href: '/travel-insurance/schengen-visa' },
              { name: 'Travel Medical Insurance', href: '/travel-insurance/medical' },
              { name: 'Annual Multi-Trip Insurance', href: '/travel-insurance/annual-multi-trip' },
              { name: 'International Travel Insurance', href: '/travel-insurance/international' },
              { name: 'All Travel Insurance Plans', href: '/travel-insurance' },
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
