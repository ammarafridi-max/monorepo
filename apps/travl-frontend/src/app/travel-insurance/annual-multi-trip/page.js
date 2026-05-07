import Link from 'next/link';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineHotel } from 'react-icons/md';
import { Calendar, Globe, ShieldCheck, Banknote, BadgeCheck, Zap } from 'lucide-react';
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
    text: 'Select your policy start date, destination region, and number of travelers. Annual plans cover all trips within your chosen region for 12 months from the start date.',
  },
  {
    title: 'Fill in Passenger Details',
    text: "Enter each traveler's full name, date of birth, nationality, and passport number exactly as they appear on the passport. Accurate details ensure your policy is issued correctly.",
  },
  {
    title: 'Pay and Receive Your Policy',
    text: 'Complete your payment securely online and receive your annual multi-trip travel insurance policy by email within minutes. Your coverage begins on your chosen start date.',
  },
];

const testimonials = [
  {
    quote: 'I travel for work every few months. The annual plan from Travl has saved me so much time — one policy, sorted for the whole year.',
    name: 'Tariq B.',
    location: 'Dubai, UAE',
    stars: 5,
    plan: 'Annual Multi-Trip',
  },
  {
    quote: 'Used the annual plan for three separate Schengen trips this year. Accepted each time without issues. Great value for frequent travellers.',
    name: 'Sophie L.',
    location: 'Abu Dhabi, UAE',
    stars: 5,
    plan: 'Annual Multi-Trip',
  },
  {
    quote: 'Much cheaper than buying single-trip insurance every time I travel. The annual plan covers everything I need and the policy arrived instantly.',
    name: 'Khalid R.',
    location: 'Sharjah, UAE',
    stars: 5,
    plan: 'Annual Multi-Trip',
  },
];

const benefits = [
  {
    icon: Calendar,
    title: 'One Policy for the Whole Year',
    text: 'Pay once and stay covered for every trip you take over the next 12 months. There is no need to arrange new insurance before each departure.',
  },
  {
    icon: Globe,
    title: 'Covers Multiple Destinations',
    text: 'Annual plans can cover specific regions or worldwide travel, so you are protected whether you are visiting Europe, Asia, or anywhere else.',
  },
  {
    icon: ShieldCheck,
    title: 'Schengen-Compliant for Every European Trip',
    text: 'Our annual plans meet the travel insurance requirements for Schengen visa applications, so you can use the same policy for multiple European trips throughout the year.',
  },
  {
    icon: Banknote,
    title: 'Annual Holiday Insurance vs Single-Trip',
    text: 'If you travel more than twice a year, an annual plan typically works out cheaper than buying a new single-trip policy each time you travel.',
  },
  {
    icon: BadgeCheck,
    title: 'Issued by AXA',
    text: 'Every annual policy is underwritten and issued by AXA. Your certificate is genuine, legally valid, and accepted for embassy submissions and actual medical claims.',
  },
  {
    icon: Zap,
    title: 'Instant Policy Delivery',
    text: 'Pay online and receive your annual travel insurance certificate by email immediately. Your coverage begins from the date you select.',
  },
];

export const faqs = [
  {
    question: 'What is annual multi-trip travel insurance?',
    answer:
      'Annual multi-trip travel insurance is a single policy that covers all your international trips within a 12-month period. You buy it once and it applies to every trip you take, up to the maximum trip duration specified in your plan.',
  },
  {
    question: 'How is yearly travel insurance different from single-trip cover?',
    answer:
      'A single-trip policy covers one specific journey between set dates. An annual multi-trip policy covers all trips within a year, which typically makes it more cost-effective if you travel more than once or twice annually.',
  },
  {
    question: 'Is annual multi-trip insurance Schengen compliant?',
    answer:
      'Yes. Our annual plans include the required medical coverage for Schengen visa applications and are accepted by embassies and visa centres including VFS and BLS.',
  },
  {
    question: 'How many trips can I take on an annual plan?',
    answer:
      'Annual plans typically cover an unlimited number of trips per year, subject to a maximum duration per individual trip. The exact limit depends on the plan you select.',
  },
  {
    question: 'Does multi-trip insurance UAE cover worldwide destinations?',
    answer:
      'Yes. You can choose a plan that covers specific regions or worldwide destinations, depending on where you travel throughout the year.',
  },
  {
    question: 'How quickly will I receive my annual insurance policy?',
    answer:
      'Your policy is issued instantly and delivered to your email within minutes of successful payment. No office visit is required.',
  },
];

export const pageData = {
  meta: {
    title: 'Annual Multi-Trip Travel Insurance in UAE | AED 245 | Travl',
    description:
      'Annual multi-trip travel insurance for UAE residents, issued by AXA. One policy covers all your trips for a year. From AED 245. Instant policy delivery.',
    canonical: 'https://www.travl.ae/travel-insurance/annual-multi-trip',
  },
  sections: {
    hero: {
      title: 'Annual Multi-Trip Travel Insurance for UAE Residents',
      subtitle: 'One Policy · All Year Round',
      text: 'Annual multi-trip travel insurance gives you a single policy that covers every trip you take within a 12-month period. Instead of buying a new policy each time you travel, you pay once and stay covered all year. Plans are issued by AXA and start from AED 245.',
      pills: ['Unlimited Trips Covered', '12-Month Validity', 'From AED 245', 'Issued by AXA'],
    },
    process: {
      title: 'How to Get Annual Travel Insurance',
      subtitle: 'Get covered in 3 quick steps',
      steps: processSteps,
    },
    about: {
      title: 'About Our Annual Multi-Trip Plans',
      text: 'We provide annual multi-trip travel insurance for UAE residents who travel frequently. One policy from AXA covers all your international trips throughout the year, with no need to arrange new coverage before each departure. Each trip is covered from the moment you leave the UAE until you return, up to the maximum trip duration in your plan.',
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Annual Multi-Trip Insurance',
          description:
            'One AXA policy covering all your international trips for 12 months. Schengen-compliant for every European trip, from AED 245 — the smart choice for frequent travellers.',
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Flight Itineraries',
          description:
            'Verifiable flight reservations with a real PNR code. Useful for individual visa applications throughout the year, accepted by VFS, BLS, and embassies. From AED 49.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'We provide hotel reservations by email, formatted to meet embassy requirements — available whenever you need proof of accommodation for a visa application.',
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
      price: '245.00',
      currency: 'AED',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'Annual Multi-Trip Travel Insurance FAQ',
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
          { label: 'Annual Multi-Trip', path: '/travel-insurance/annual-multi-trip' },
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
        title="Why UAE Residents Choose Our Annual Multi-Trip Plans"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Customers Say"
        subtitle="Real feedback from frequent travellers who use Travl's annual multi-trip plans"
        testimonials={testimonials}
      />
      <Faqs
        title="Annual Multi-Trip Insurance — Frequently Asked Questions"
        subtitle="Common questions about annual plans, trip limits, and coverage scope"
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
              { name: 'International Travel Insurance', href: '/travel-insurance/international' },
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
