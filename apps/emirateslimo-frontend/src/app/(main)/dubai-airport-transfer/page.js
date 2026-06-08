import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { airportTransferFaqs } from '@/data/faqs';
import { airportTransferTestimonials } from '@/data/testimonials';
import { airportTransferSchema } from '@/data/serviceSchemas';

import { buildBreadcrumbList } from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import ServiceCta from '@/components/ServiceCta';
import Process from '@/components/HomeComponents/Process';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Services from '@/components/HomeComponents/Services';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';
import Fleet from '@/components/HomeComponents/Fleet';

export const metadata = {
  title: 'Dubai Airport Transfer | Emirates Limo Pickup & Dropoff',
  description:
    'Book Dubai airport transfer with Emirates Limo for luxury pickup and dropoff service, professional chauffeurs, and instant booking confirmation.',
  alternates: { canonical: 'https://www.emirateslimo.com/dubai-airport-transfer' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Dubai Airport Transfer | Emirates Limo Pickup & Dropoff',
    description: 'Book Dubai airport transfer with Emirates Limo for luxury pickup and dropoff service, professional chauffeurs, and instant booking confirmation.',
    url: 'https://www.emirateslimo.com/dubai-airport-transfer',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Dubai Airport Transfer — Emirates Limo luxury chauffeur service',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dubai Airport Transfer | Emirates Limo Pickup & Dropoff',
    description: 'Book Dubai airport transfer with Emirates Limo for luxury pickup and dropoff service, professional chauffeurs, and instant booking confirmation.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Fleet',
    text: 'Experience ultimate comfort in our luxury Sedans, SUVs, and Vans, all impeccably maintained and chauffeur-driven.',
  },
  {
    icon: LuShieldCheck,
    title: 'Experienced Chauffeurs',
    text: 'Our professional chauffeurs ensure a safe, comfortable, private, and punctual ride — every time, for every traveler.',
  },
  {
    icon: LuClock,
    title: 'Always On Time',
    text: 'Your time is important to us. We offer real-time tracking and pre-scheduled bookings to ensure timely pickup and dropoff.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible Cancellation',
    text: 'Plans change, and we understand. Receive 100% refund when you cancel at least 24 hours before the pick up time.',
  },
];

export default function DubaiAirportTransfer() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(airportTransferSchema).replace(/</g, '\u003c') }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Dubai Airport Transfer', href: '/dubai-airport-transfer' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Dubai Airport Transfer"
        subtitle="60 Mins Waiting Time, 24/7 Service"
        text="Step off the plane and into a chauffeur-driven luxury vehicle. Discreet service, professional chauffeurs, and seamless airport transfers."
      />

      <WhyBookEmiratesLimo
        title="Why Book Your Dubai Airport Transfer With Us?"
        subtitle="Why Choose Us"
        benefits={benefits}
      />

      <Process
        title="Book Your Airport Transfer in 4 Easy Steps"
        subtitle="Our Process"
      />

      <Services
        title="Premium Chauffeur Experiences in Dubai"
        subtitle="Our Services"
      />

      <Fleet
        title="Luxury Vehicles To Choose From"
        subtitle="Our Fleet"
      />

      <ServiceCta
        title="Ready to book your Dubai airport transfer?"
        text="Choose your vehicle from our luxury fleet or start your booking in minutes."
        primary={{ href: '/book/select-limo', label: 'Start Booking' }}
        secondary={{ href: '/fleet', label: 'View Fleet' }}
      />

      <FAQs
        title="Frequently Asked Questions"
        subtitle="Airport Transfer FAQs"
        faqs={airportTransferFaqs}
        includeJsonLd
      />

      <Testimonials
        title="What Our Clients Say"
        subtitle="Client Testimonials"
        testimonials={airportTransferTestimonials}
      />
    </>
  );
}
