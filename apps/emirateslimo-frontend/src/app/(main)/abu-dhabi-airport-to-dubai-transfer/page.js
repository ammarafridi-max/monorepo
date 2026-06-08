import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { airportTransferFaqs } from '@/data/faqs';
import { airportTransferTestimonials } from '@/data/testimonials';
import { abuDhabiToDubaiAirportTransferSchema } from '@/data/serviceSchemas';

import { buildBreadcrumbList } from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import Process from '@/components/HomeComponents/Process';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Services from '@/components/HomeComponents/Services';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';
import Fleet from '@/components/HomeComponents/Fleet';

export const metadata = {
  title: 'Abu Dhabi to Dubai Airport Transfer | Emirates Limo',
  description:
    'Book a luxury Abu Dhabi to Dubai Airport transfer with professional chauffeurs, premium vehicles, and reliable on-time service. Perfect for departures to DXB or DWC.',
  alternates: { canonical: 'https://www.emirateslimo.com/abu-dhabi-airport-to-dubai-transfer' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Abu Dhabi to Dubai Airport Transfer | Emirates Limo',
    description: 'Book a luxury Abu Dhabi to Dubai Airport transfer with professional chauffeurs, premium vehicles, and reliable on-time service. Perfect for departures to DXB or DWC.',
    url: 'https://www.emirateslimo.com/abu-dhabi-airport-to-dubai-transfer',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Abu Dhabi to Dubai Airport Transfer — Emirates Limo private chauffeur',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abu Dhabi to Dubai Airport Transfer | Emirates Limo',
    description: 'Book a luxury Abu Dhabi to Dubai Airport transfer with professional chauffeurs, premium vehicles, and reliable on-time service. Perfect for departures to DXB or DWC.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Private Airport Transfers',
    text: 'Travel from Abu Dhabi to Dubai Airport in premium Sedans, SUVs, and Vans — luxury-maintained, spacious, and chauffeur-driven for maximum comfort.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professional Chauffeurs',
    text: 'Your Abu Dhabi to Dubai Airport transfer is handled by trained, licensed chauffeurs who ensure safe, discreet, and reliable service every time.',
  },
  {
    icon: LuClock,
    title: 'On-Time, Always',
    text: 'We understand airport timing. Expect punctual pickup, carefully planned routes, and smooth travel to Dubai International Airport (DXB) or Al Maktoum Airport (DWC).',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Convenient Booking',
    text: "Travel plans changed? No worries. Enjoy flexible scheduling and free cancellation up to 24 hours before your airport transfer.",
  },
];

export default function AbuDhabiAirportToDubaiTransfer() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(abuDhabiToDubaiAirportTransferSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Abu Dhabi to Dubai Airport Transfer', href: '/abu-dhabi-airport-to-dubai-transfer' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Abu Dhabi to Dubai Airport Transfer"
        subtitle="Luxury • Reliable • On Time"
        text="Enjoy a smooth and stress-free Abu Dhabi to Dubai Airport transfer with Emirates Limo. Our professional chauffeurs, premium vehicles, and perfectly timed service ensure you arrive at Dubai Airport comfortably and on schedule."
      />

      <WhyBookEmiratesLimo
        title="Why Book Your Abu Dhabi to Dubai Airport Transfer With Us?"
        subtitle="Premium Airport Travel Experience"
        benefits={benefits}
      />

      <Process
        title="Book Your Abu Dhabi to Dubai Airport Transfer in 4 Easy Steps"
        subtitle="Simple & Hassle-Free"
      />

      <Services
        title="Premium Airport Chauffeur Services"
        subtitle="Luxury Airport Transport"
      />

      <Fleet
        title="Luxury Vehicles For Airport Transfers"
        subtitle="Premium Fleet"
      />

      <FAQs
        title="Abu Dhabi to Dubai Airport Transfer – FAQs"
        subtitle="Frequently Asked Questions"
        faqs={airportTransferFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Airport Transfer Service"
        subtitle="What Our Clients Say"
        testimonials={airportTransferTestimonials}
      />
    </>
  );
}
