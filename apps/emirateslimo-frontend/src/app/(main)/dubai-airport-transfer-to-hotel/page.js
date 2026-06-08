import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { airportTransferFaqs } from '@/data/faqs';
import { airportTransferTestimonials } from '@/data/testimonials';
import { dubaiAirportTransferToHotelSchema } from '@/data/serviceSchemas';

import { buildBreadcrumbList } from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import Process from '@/components/HomeComponents/Process';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Services from '@/components/HomeComponents/Services';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';
import Fleet from '@/components/HomeComponents/Fleet';

export const metadata = {
  title: 'Dubai Airport to Hotel Transfer | Emirates Limo',
  description:
    'Book a luxury airport transfer from Dubai Airport to your hotel. Professional chauffeurs, premium vehicles, meet & greet, and on-time pickup in Dubai.',
  alternates: { canonical: 'https://www.emirateslimo.com/dubai-airport-transfer-to-hotel' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Dubai Airport to Hotel Transfer | Emirates Limo',
    description: 'Book a luxury airport transfer from Dubai Airport to your hotel. Professional chauffeurs, premium vehicles, meet & greet, and on-time pickup in Dubai.',
    url: 'https://www.emirateslimo.com/dubai-airport-transfer-to-hotel',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Dubai Airport Transfer to Hotel — Emirates Limo luxury service',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dubai Airport to Hotel Transfer | Emirates Limo',
    description: 'Book a luxury airport transfer from Dubai Airport to your hotel. Professional chauffeurs, premium vehicles, meet & greet, and on-time pickup in Dubai.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Airport Transfer in Dubai',
    text: 'Enjoy premium transportation from Dubai Airport to your hotel with luxury Sedans, SUVs, and Vans — all impeccably maintained for maximum comfort.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professional Chauffeurs',
    text: 'Your airport transfer from Dubai Airport to hotel is handled by experienced, well-trained chauffeurs ensuring safety, privacy, and a smooth ride.',
  },
  {
    icon: LuClock,
    title: 'On-Time Pickup & Flight Tracking',
    text: 'We monitor your flight and provide 60 minutes of free waiting time to guarantee a stress-free Dubai airport transfer to hotel.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Easy Booking',
    text: "Plans change — and that's okay. We offer flexible booking and free cancellation up to 24 hours before your Dubai airport transfer.",
  },
];

export default function DubaiAirportTransferToHotel() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dubaiAirportTransferToHotelSchema).replace(/</g, '\u003c') }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Dubai Airport Transfer to Hotel', href: '/dubai-airport-transfer-to-hotel' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Dubai Airport Transfer to Hotel"
        subtitle="Luxury Airport Transfer Dubai – 24/7 Service"
        text="Arrive in style with our luxury airport transfer from Dubai Airport to hotel. Enjoy meet & greet service, 60 minutes free waiting time, and professional chauffeurs."
      />

      <WhyBookEmiratesLimo
        title="Why Book Your Dubai Airport Transfer to Hotel With Us?"
        subtitle="Luxury, Comfort & Reliability"
        benefits={benefits}
      />

      <Process
        title="Book Your Dubai Airport Transfer in 4 Easy Steps"
        subtitle="Simple & Hassle-Free"
      />

      <Services
        title="Transportation From Dubai Airport to Hotel"
        subtitle="Premium Airport Transfer Services"
      />

      <Fleet
        title="Luxury Vehicles For Your Airport Transfer"
        subtitle="Our Fleet"
      />

      <FAQs
        title="Dubai Airport Transfer to Hotel – FAQs"
        subtitle="Airport Transfer FAQs"
        faqs={airportTransferFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Dubai Airport Transfer Service"
        subtitle="Client Testimonials"
        testimonials={airportTransferTestimonials}
      />
    </>
  );
}
