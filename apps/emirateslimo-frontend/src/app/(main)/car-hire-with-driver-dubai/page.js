import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { chauffeurFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';
import { carHireWithDriverDubaiSchema } from '@/data/serviceSchemas';

import { buildBreadcrumbList } from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import Process from '@/components/HomeComponents/Process';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Services from '@/components/HomeComponents/Services';
import Fleet from '@/components/HomeComponents/Fleet';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';

export const metadata = {
  title: 'Car Hire With Driver Dubai | Car With Driver for Rent',
  description:
    'Book car hire with driver Dubai service for business trips, airport transfers, events, and city travel with professional chauffeurs and luxury vehicles.',
  alternates: { canonical: 'https://www.emirateslimo.com/car-hire-with-driver-dubai' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Car Hire With Driver Dubai | Car With Driver for Rent',
    description: 'Book car hire with driver Dubai service for business trips, airport transfers, events, and city travel with professional chauffeurs and luxury vehicles.',
    url: 'https://www.emirateslimo.com/car-hire-with-driver-dubai',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Car Hire With Driver Dubai — Emirates Limo luxury chauffeur rental',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Hire With Driver Dubai | Car With Driver for Rent',
    description: 'Book car hire with driver Dubai service for business trips, airport transfers, events, and city travel with professional chauffeurs and luxury vehicles.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Cars With Professional Drivers',
    text: 'Hire a luxury car with driver in Dubai and enjoy premium comfort in our Sedans, SUVs, and Vans — all impeccably maintained and ready when you are.',
  },
  {
    icon: LuShieldCheck,
    title: 'Trained & Experienced Drivers',
    text: 'Every car with driver for rent in Dubai is handled by a professional, well-trained chauffeur who ensures privacy, safety, and a smooth journey.',
  },
  {
    icon: LuClock,
    title: 'Punctual & Reliable Service',
    text: 'Our Dubai car hire with driver service guarantees on-time pickups, real-time tracking, and perfectly planned journeys for stress-free travel.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Hassle-Free Booking',
    text: "Plans change — and that's okay. Enjoy flexible scheduling and free cancellation up to 24 hours before your trip.",
  },
];

export default function CarHireWithDriverDubai() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(carHireWithDriverDubaiSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Car Hire With Driver Dubai', href: '/car-hire-with-driver-dubai' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Car Hire With Driver in Dubai"
        subtitle="Luxury Cars With Professional Drivers"
        text="Book a premium car hire with driver in Dubai and travel in comfort with expert chauffeurs, luxury vehicles, and reliable service across the UAE."
      />

      <WhyBookEmiratesLimo
        title="Why Choose Our Car Hire With Driver in Dubai?"
        subtitle="Why Book With Emirates Limo"
        benefits={benefits}
      />

      <Process
        title="Book Your Car With Driver in 4 Easy Steps"
        subtitle="Simple & Fast Booking"
      />

      <Services
        title="Car With Driver for Rent in Dubai — Perfect For Every Need"
        subtitle="Our Chauffeur Services"
      />

      <Fleet
        title="Choose Your Luxury Car With Driver"
        subtitle="Our Fleet"
      />

      <FAQs
        title="Car Hire With Driver Dubai — FAQs"
        subtitle="FAQs"
        faqs={chauffeurFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Dubai Car Hire With Driver Service"
        subtitle="Client Testimonials"
        testimonials={chauffeurTestimonials}
      />
    </>
  );
}
