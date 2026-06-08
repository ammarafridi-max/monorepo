import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { airportTransferFaqs } from '@/data/faqs';
import { airportTransferTestimonials } from '@/data/testimonials';
import { abuDhabiAirportTransferSchema } from '@/data/serviceSchemas';

import { buildBreadcrumbList } from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import Process from '@/components/HomeComponents/Process';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Services from '@/components/HomeComponents/Services';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';
import Fleet from '@/components/HomeComponents/Fleet';

export const metadata = {
  title: 'Abu Dhabi Airport Transfer | Emirates Limo',
  description:
    'Book a luxury Abu Dhabi airport transfer with professional chauffeurs, meet & greet service, and on-time pickup. Premium vehicles for hotel and city transfers.',
  alternates: { canonical: 'https://www.emirateslimo.com/abu-dhabi-airport-transfer' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Abu Dhabi Airport Transfer | Emirates Limo',
    description: 'Book a luxury Abu Dhabi airport transfer with professional chauffeurs, meet & greet service, and on-time pickup. Premium vehicles for hotel and city transfers.',
    url: 'https://www.emirateslimo.com/abu-dhabi-airport-transfer',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Abu Dhabi Airport Transfer — Emirates Limo luxury chauffeur service',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abu Dhabi Airport Transfer | Emirates Limo',
    description: 'Book a luxury Abu Dhabi airport transfer with professional chauffeurs, meet & greet service, and on-time pickup. Premium vehicles for hotel and city transfers.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Abu Dhabi Airport Transfer Fleet',
    text: 'Travel in comfort with premium Sedans, SUVs, and Vans — perfectly maintained and chauffeur-driven for a smooth airport transfer.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professional Chauffeurs',
    text: 'Your Abu Dhabi airport transfer is handled by experienced, well-trained chauffeurs ensuring safety, privacy, and a relaxed journey.',
  },
  {
    icon: LuClock,
    title: 'On-Time Pickup & Flight Tracking',
    text: 'We monitor your flight and provide waiting time to guarantee a stress-free Abu Dhabi airport pickup experience.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Hassle-Free Booking',
    text: "Plans change — and that's okay. Enjoy flexible scheduling and free cancellation up to 24 hours before pickup.",
  },
];

export default function AbuDhabiAirportTransfer() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(abuDhabiAirportTransferSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Abu Dhabi Airport Transfer', href: '/abu-dhabi-airport-transfer' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Abu Dhabi Airport Transfer"
        subtitle="Luxury Airport Pickup & 24/7 Service"
        text="Arrive in style with our premium Abu Dhabi airport transfer — professional chauffeurs, luxury vehicles, meet & greet service, and seamless door-to-door transportation."
      />

      <WhyBookEmiratesLimo
        title="Why Book Your Abu Dhabi Airport Transfer With Us?"
        subtitle="Comfort • Reliability • Luxury"
        benefits={benefits}
      />

      <Process
        title="Book Your Abu Dhabi Airport Transfer in 4 Easy Steps"
        subtitle="Simple & Hassle-Free"
      />

      <Services
        title="Premium Chauffeur Experiences in Abu Dhabi"
        subtitle="Our Services"
      />

      <Fleet
        title="Luxury Vehicles For Your Airport Transfer"
        subtitle="Our Fleet"
      />

      <FAQs
        title="Abu Dhabi Airport Transfer – FAQs"
        subtitle="Airport Transfer FAQs"
        faqs={airportTransferFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Abu Dhabi Airport Transfer Service"
        subtitle="Client Testimonials"
        testimonials={airportTransferTestimonials}
      />
    </>
  );
}
