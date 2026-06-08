import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { chauffeurFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';
import { hourlyChauffeurSchema } from '@/data/serviceSchemas';

import { buildBreadcrumbList } from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import ServiceCta from '@/components/ServiceCta';
import Process from '@/components/HomeComponents/Process';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Services from '@/components/HomeComponents/Services';
import Fleet from '@/components/HomeComponents/Fleet';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';

export const metadata = {
  title: 'Hourly Chauffeur Dubai | Flexible Chauffeur Service',
  description:
    'Book hourly chauffeur Dubai service for meetings, shopping, events, and city travel with luxury vehicles and professional drivers on demand.',
  alternates: { canonical: 'https://www.emirateslimo.com/hourly-chauffeur' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Hourly Chauffeur Dubai | Flexible Chauffeur Service',
    description: 'Book hourly chauffeur Dubai service for meetings, shopping, events, and city travel with luxury vehicles and professional drivers on demand.',
    url: 'https://www.emirateslimo.com/hourly-chauffeur',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Hourly Chauffeur Dubai — Emirates Limo flexible luxury hire',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hourly Chauffeur Dubai | Flexible Chauffeur Service',
    description: 'Book hourly chauffeur Dubai service for meetings, shopping, events, and city travel with luxury vehicles and professional drivers on demand.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Fleet',
    text: "Choose from executive sedans, premium SUVs, and luxury vans — always clean and chauffeur-driven.",
  },
  {
    icon: LuShieldCheck,
    title: 'Professional Chauffeurs',
    text: 'Our experienced chauffeurs ensure comfort, privacy, and a smooth journey throughout your rental period.',
  },
  {
    icon: LuClock,
    title: 'Flexible Hourly Packages',
    text: "Pay only for the duration you need, whether it's 2 hours or a full-day hire.",
  },
  {
    icon: LuCalendarX,
    title: 'Flexible Cancellation',
    text: 'Free cancellation when done at least 24 hours before pickup.',
  },
];

export default function HourlyChauffeurDubai() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hourlyChauffeurSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Hourly Chauffeur Dubai', href: '/hourly-chauffeur' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Hourly Chauffeur Service in Dubai"
        subtitle="Flexible Hourly Hire"
        text="For ultimate convenience and flexibility, our hourly chauffeur service in Dubai gives you a private driver and luxury vehicle on standby for as long as you need."
      />

      <WhyBookEmiratesLimo
        title="Why Book Your Hourly Chauffeur With Us?"
        subtitle="Why Choose Us"
        benefits={benefits}
      />

      <Process
        title="Book Your Hourly Chauffeur in 4 Easy Steps"
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
        title="Need a full chauffeur solution?"
        text="For full-day and executive travel, explore our main chauffeur service page."
        primary={{ href: '/chauffeur-service', label: 'View Chauffeur Service' }}
      />

      <FAQs
        title="Hourly Chauffeur Dubai — FAQs"
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
