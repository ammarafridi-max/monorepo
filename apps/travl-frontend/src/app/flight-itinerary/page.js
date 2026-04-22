import { lazy, Suspense } from 'react';
import { testimonials } from '@/data/testimonials';
import { buildMetadata } from '@/lib/publicMetadata';
import {
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import {
  HiCheck,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi2';
import Hero from '@travel-suite/frontend-shared/components/v1/sections/Hero';
import AllForms from '@travel-suite/frontend-shared/components/v1/forms/AllForms';

const Process = lazy(() => import('@/components/sections/Process'));
const Benefits = lazy(() => import('@/components/sections/Benefits'));
const Contact = lazy(() => import('@/components/sections/Contact'));

const keyword = 'flight reservation';

export const benefits = [
  {
    title: 'Airline Booking Format',
    text: 'We provide a real itinerary with a verifiable PNR and clear trip details in standard airline booking format.',
    icon: HiCheck,
  },
  {
    title: 'Instant Delivery',
    text: 'Our automated process ensures you receive your flight itinerary by email within minutes-quick, seamless, and completely hassle-free.',
    icon: HiOutlineClock,
  },
  {
    title: 'Great Value',
    text: 'Starting from just AED 49, we provide professionally prepared flight itineraries at an affordable price with fast delivery and clear booking details.',
    icon: HiOutlineCurrencyDollar,
  },
];

export const pageData = {
  meta: {
    title: 'Flight Itinerary From AED 49 | Instant Delivery With PNR',
    description:
      'Get a real flight itinerary with a valid PNR issued in standard airline booking format.',
    canonical: 'https://www.travl.ae/flight-itinerary',
  },
  sections: {
    hero: {
      title: 'Flight Itineraries for Travel from AED 49',
      subtitle:
        'Receive a real itinerary in standard booking format with a valid PNR and trip details delivered by email.',
      form: <AllForms />,
    },
    process: {
      title: 'How To Get Your Flight Itinerary?',
      subtitle: 'Get your itinerary in 3 easy and simple steps',
      keyword,
    },
    benefits: {
      title: 'Why Choose Us?',
      subtitle: 'Fast and reliable flight itinerary service',
      benefits,
    },
    testimonials: {
      title: 'Testimonials',
      subtitle: 'What our customers say about us',
      testimonials,
    },
    contact: {
      title: '24/7 Customer Support',
      text: 'Need help with your booking? Our support team is available 24/7.',
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
      price: '49.00',
      currency: 'AED',
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
        form={pageData.sections.hero.form}
      />
      <Suspense fallback={null}>
        <Process
          title={pageData.sections.process.title}
          subtitle={pageData.sections.process.subtitle}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Benefits
          title={pageData.sections.benefits.title}
          subtitle={pageData.sections.benefits.subtitle}
          benefits={pageData.sections.benefits.benefits}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Contact
          title={pageData.sections.contact.title}
          text={pageData.sections.contact.text}
        />
      </Suspense>
    </>
  );
}
