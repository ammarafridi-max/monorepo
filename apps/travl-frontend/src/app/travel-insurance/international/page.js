import Link from 'next/link';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineHotel } from 'react-icons/md';
import { Globe, HeartPulse, FileCheck, ShieldCheck, BadgeCheck, RefreshCw } from 'lucide-react';
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
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

export const processSteps = [
  {
    title: 'Enter Your Trip Details',
    text: 'Select your travel dates, destination region, and number of travelers. International plans are available for most worldwide destinations.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued and accepted without issues.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Complete your payment securely online and receive your international travel insurance policy by email within minutes. It is ready to download for visa submission or travel.',
  },
];

const testimonials = [
  {
    quote: 'Traveling to multiple countries across Europe and Asia. The international plan covered everything under one policy. Delivered instantly and accepted everywhere.',
    name: 'Daniel S.',
    location: 'Dubai, UAE',
    stars: 5,
    plan: 'International',
  },
  {
    quote: 'Had a medical emergency while traveling in Southeast Asia. The AXA policy covered my hospital bills in full. Incredibly grateful for proper international coverage.',
    name: 'Amira J.',
    location: 'Abu Dhabi, UAE',
    stars: 5,
    plan: 'International',
  },
  {
    quote: 'The EUR 80,000 medical coverage gave me real confidence traveling further afield. Great price and the policy arrived within minutes of paying.',
    name: 'Tom K.',
    location: 'Sharjah, UAE',
    stars: 5,
    plan: 'International',
  },
];

const benefits = [
  {
    icon: Globe,
    title: 'Worldwide Travel Insurance Coverage',
    text: 'Our international plans provide coverage across most destinations globally, so you are protected whether you are traveling to Europe, Asia, the Americas, or anywhere else.',
  },
  {
    icon: HeartPulse,
    title: 'Medical Coverage from EUR 80,000',
    text: 'International plans start with EUR 80,000 in emergency medical coverage, giving you solid protection for serious medical events while abroad.',
  },
  {
    icon: FileCheck,
    title: 'International Health Insurance for Visa Applications',
    text: 'Our plans meet the insurance requirements for a wide range of visa applications, including Schengen and other destinations that require proof of medical coverage.',
  },
  {
    icon: ShieldCheck,
    title: 'Emergency Medical Treatment and Repatriation',
    text: 'Coverage includes emergency hospital treatment, surgical procedures, ambulance services, and medical repatriation back to the UAE if required.',
  },
  {
    icon: BadgeCheck,
    title: 'Issued by AXA',
    text: 'Every policy is underwritten and issued by AXA. Your international travel insurance certificate is genuine, legally valid, and accepted for embassy submissions and actual medical claims.',
  },
  {
    icon: RefreshCw,
    title: 'Single-Trip and Annual Plans',
    text: 'Choose a single-trip international policy for one journey, or an annual plan if you travel frequently to multiple destinations throughout the year.',
  },
];

export const faqs = [
  {
    question: 'What is international travel insurance?',
    answer:
      'International travel insurance covers you for medical emergencies and other unexpected events when travelling outside the UAE. It typically includes emergency medical treatment, hospitalisation, and repatriation back home.',
  },
  {
    question: 'What does international health insurance cover?',
    answer:
      'Coverage includes emergency medical treatment, hospitalisation, surgical procedures, ambulance services, medical repatriation, trip cancellations, baggage loss, and travel delays, depending on the plan you choose.',
  },
  {
    question: 'How much medical coverage does your international insurance include?',
    answer:
      'Our international travel insurance plans start with EUR 80,000 in emergency medical coverage. Higher limits may be available depending on the plan you select.',
  },
  {
    question: 'Is worldwide travel insurance accepted for visa applications?',
    answer:
      'Yes. Our international insurance plans meet the requirements for Schengen visa applications and other destinations that require proof of travel coverage.',
  },
  {
    question: 'How is international travel insurance different from standard travel insurance?',
    answer:
      'Standard travel insurance may limit coverage to specific regions. International and worldwide travel insurance covers most global destinations, making it suitable for travelers visiting multiple countries or less common destinations.',
  },
  {
    question: 'How quickly will I receive my international insurance policy?',
    answer:
      'Your policy is issued instantly and delivered to your email within minutes of successful payment. No office visit is required.',
  },
];

export const pageData = {
  meta: {
    title: 'International Travel Insurance for UAE Residents | Travl',
    description:
      'Worldwide travel insurance for UAE residents, issued by AXA. International health insurance from AED 70 with medical cover from EUR 80,000. Instant delivery.',
    canonical: 'https://www.travl.ae/travel-insurance/international',
  },
  sections: {
    hero: {
      title: 'International Travel Insurance for UAE Residents',
      subtitle: 'Worldwide Coverage · From AED 70',
      text: 'International travel insurance covers you for medical emergencies, hospitalisation, and repatriation anywhere in the world. Plans are issued by AXA, start from AED 70, and include medical coverage from EUR 80,000. Get your policy online and receive it in minutes.',
      pills: ['Worldwide Coverage', 'EUR 80,000 Medical', 'Repatriation Included', 'From AED 70'],
    },
    process: {
      title: 'How to Get International Travel Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our International Travel Insurance',
      text: 'We provide worldwide travel insurance for UAE residents through AXA. Our international health insurance plans cover emergency medical expenses, hospital treatment, and repatriation for trips across the globe. Plans start from AED 70 with medical coverage beginning at EUR 80,000, and your policy is delivered instantly after payment.',
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'International Travel Insurance',
          description:
            'Worldwide AXA coverage from AED 70 with medical cover from EUR 80,000. Includes emergency treatment, repatriation, trip cancellations, and baggage loss — all delivered instantly.',
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Flight Itineraries',
          description:
            'Verifiable flight reservations with a real PNR, accepted by embassies and visa centres worldwide. Often needed together with travel insurance for international visa applications. From AED 49.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'We provide hotel reservations by email, formatted to meet embassy requirements. A quick way to complete your proof of accommodation for any visa application.',
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
    buildProduct({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      price: '70.00',
      currency: 'AED',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'International Travel Insurance FAQ',
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
          { label: 'International', path: '/travel-insurance/international' },
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
        title="Why UAE Residents Choose Our International Travel Insurance"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for international travel insurance"
        testimonials={testimonials}
      />
      <Faqs
        title="International Travel Insurance — Frequently Asked Questions"
        subtitle="Common questions about worldwide coverage, medical limits, and plans"
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
              { name: 'Single Trip Insurance', href: '/travel-insurance/single-trip' },
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
