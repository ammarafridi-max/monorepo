import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineHotel } from 'react-icons/md';
import { ShieldCheck, FileCheck, Zap, Globe, Banknote, RefreshCw } from 'lucide-react';
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
    text: 'Select your trip start and end dates, choose your destination region, and enter the number of travelers by age group. Whether you are traveling solo or with family, the form adjusts to your exact needs.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued correctly and accepted without issues at any embassy or visa center.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Review your selected plan, complete your payment securely online, and receive your travel insurance policy by email within minutes. It is ready to download immediately for visa submission or travel.',
  },
];

const testimonials = [
  {
    quote: 'Got my Schengen travel insurance in under 5 minutes. The policy was accepted by the French embassy without any issues. Incredible service.',
    name: 'Fatima A.',
    location: 'Dubai, UAE',
    stars: 5,
    plan: 'Schengen Insurance',
  },
  {
    quote: 'I needed insurance for a last-minute UK visa application. Travl delivered the policy within minutes and it had everything the embassy required.',
    name: 'James P.',
    location: 'Abu Dhabi, UAE',
    stars: 5,
    plan: 'Single Trip',
  },
  {
    quote: "Very straightforward process. I've used Travl three times now for different trips and the policy always arrives quickly and is accepted without problems.",
    name: 'Meera S.',
    location: 'Sharjah, UAE',
    stars: 5,
    plan: 'Annual Multi-Trip',
  },
];

const benefits = [
  {
    icon: FileCheck,
    title: 'Genuine Policy, Not a Reservation',
    text: 'Our travel insurance is a fully valid, legally issued policy backed by a licensed insurer. It is not a placeholder or a reservation.',
  },
  {
    icon: ShieldCheck,
    title: 'Embassy-Compliant Coverage',
    text: 'Our plans meet official visa requirements, including the minimum EUR 30,000 medical coverage required for Schengen visa applications.',
  },
  {
    icon: Zap,
    title: 'Instant Policy Delivery',
    text: 'Once your payment is confirmed, your policy is issued and delivered to your inbox within minutes. No office visit and no waiting.',
  },
  {
    icon: Globe,
    title: 'Covers the Full Trip',
    text: 'Coverage includes emergency medical expenses, hospitalization, trip cancellations, baggage loss, travel delays, and COVID-19 medical coverage (as per policy terms).',
  },
  {
    icon: Banknote,
    title: 'Affordable Rates for Every Trip',
    text: 'We offer competitive pricing for single-trip and annual plans, giving UAE residents strong coverage with practical pricing.',
  },
  {
    icon: RefreshCw,
    title: 'Single and Annual Plans Available',
    text: 'Choose a single-trip plan for one-off travel or an annual multi-trip plan if you travel frequently.',
  },
];

export const faqs = [
  {
    question:
      'Is travel insurance mandatory for UAE residents traveling abroad?',
    answer:
      'Yes, many countries require valid travel insurance as part of the visa application process. Schengen states in particular make it a strict requirement.',
  },
  {
    question: 'Does your travel insurance meet Schengen visa requirements?',
    answer:
      'Yes. Our plans include the minimum EUR 30,000 medical coverage required by Schengen consulates and are suitable for embassy, VFS, and BLS submissions.',
  },
  {
    question: 'Is this a real insurance policy or a dummy document?',
    answer:
      'This is a fully genuine, underwritten insurance policy issued by a licensed insurer. It is not a dummy document.',
  },
  {
    question: 'How quickly will I receive my policy after payment?',
    answer:
      'Your policy is issued instantly and delivered to your email within minutes of successful payment.',
  },
  {
    question: 'Can I buy travel insurance online as a UAE resident?',
    answer:
      'Yes. UAE residents and citizens can purchase and receive a fully valid travel insurance policy entirely online.',
  },
  {
    question: 'What does the travel insurance policy cover?',
    answer:
      'Coverage includes emergency medical expenses, hospital stays, trip cancellations, baggage loss, travel delays, and COVID-19 related medical treatment during your trip.',
  },
];

export const pageData = {
  meta: {
    title: 'Travel Insurance for UAE Residents | Instant Policy Delivery',
    description:
      'Get real, embassy-compliant travel insurance online with instant policy delivery for UAE residents and citizens.',
    canonical: 'https://www.travl.ae/travel-insurance',
  },
  sections: {
    hero: {
      title: 'Travel Insurance for UAE Residents',
      subtitle: 'Instant Policy Delivery · From AED 30',
      text: 'Get real, embassy-compliant travel insurance online with instant policy delivery. Our plans are genuine, legally valid, and accepted for Schengen visa applications and international travel from the UAE.',
      pills: ['Schengen Compliant', 'Instant Policy Delivery', 'Issued by AXA', 'Embassy Accepted'],
    },
    process: {
      title: 'How to Book Travel Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our Travel Insurance',
      text: 'We provide travel insurance for UAE residents and citizens with instant policy delivery, genuine coverage, and pricing that makes sense. Every plan we issue meets embassy requirements and gives you real protection throughout your trip.',
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Genuine AXA-backed travel insurance for UAE residents. Every plan meets embassy requirements, covers medical emergencies and trip cancellations, and is delivered instantly after payment.',
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Flight Itineraries',
          description:
            'Verifiable flight reservations with a real PNR code, accepted by VFS, BLS, and embassies. Often needed alongside insurance for a complete Schengen or UK visa application. From AED 49.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Need proof of accommodation for your visa? We provide hotel reservations by email, formatted to meet embassy requirements and ready to submit with your application.',
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
      title: 'Travel Insurance FAQ',
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
        title="Why Book Travel Insurance With Us?"
        subtitle="Trusted travel insurance provider for UAE residents"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from UAE residents who used Travl for their travel documents"
        testimonials={testimonials}
      />
      <PrimarySection className="py-14 md:py-18 lg:py-24">
        <Container className="rounded-3xl border border-primary-100 bg-[linear-gradient(145deg,#f5fbfb_0%,#eff7ff_55%,#fff7f0_100%)] p-8 md:p-10">
          <SectionTitle textAlign="center" className="mb-4">
            Ready to Get Insured Before Your Trip?
          </SectionTitle>
          <p className="text-[16px] md:text-[18px] text-gray-700 font-light leading-7 max-w-[820px]">
            Do not leave your travel plans or your visa application without
            proper coverage. Get your genuine, embassy-accepted travel insurance
            policy in minutes and travel from the UAE with confidence.
          </p>
        </Container>
      </PrimarySection>
      <Faqs
        title="Travel Insurance — Frequently Asked Questions"
        subtitle="Common questions about our plans, coverage, and how to get your policy"
        faqs={faqs}
      />
    </>
  );
}
