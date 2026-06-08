import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { chauffeurSchema } from '@/data/serviceSchemas';
import { chauffeurFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';

import { buildBreadcrumbList } from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import Process from '@/components/HomeComponents/Process';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Services from '@/components/HomeComponents/Services';
import Fleet from '@/components/HomeComponents/Fleet';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';

export const metadata = {
  title: 'Chauffeur Service Dubai | Private Chauffeur & Luxury Rides',
  description:
    'Book chauffeur service in Dubai with private drivers and luxury vehicles. Professional rides for business travel, events, airport transfers, and city trips.',
  alternates: { canonical: 'https://www.emirateslimo.com/chauffeur-service' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Chauffeur Service Dubai | Private Chauffeur & Luxury Rides',
    description: 'Book chauffeur service in Dubai with private drivers and luxury vehicles. Professional rides for business travel, events, airport transfers, and city trips.',
    url: 'https://www.emirateslimo.com/chauffeur-service',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Chauffeur Service Dubai — Emirates Limo luxury private driver',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chauffeur Service Dubai | Private Chauffeur & Luxury Rides',
    description: 'Book chauffeur service in Dubai with private drivers and luxury vehicles. Professional rides for business travel, events, airport transfers, and city trips.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Chauffeur Fleet',
    text: 'Choose from premium Sedans, SUVs, and Vans for your chauffeur hire in Dubai — impeccably maintained, spacious, and chauffeur-driven.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professional Chauffeur Service',
    text: 'Our highly trained, courteous, and experienced chauffeurs ensure a safe, private, and comfortable luxury chauffeur service experience in Dubai.',
  },
  {
    icon: LuClock,
    title: 'Punctual & Reliable',
    text: 'Enjoy on-time chauffeur service in Dubai with carefully planned routes and real-time monitoring to avoid delays.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Hassle-Free',
    text: 'Plans changed? No problem. Benefit from flexible booking options and free cancellation up to 24 hours before pickup.',
  },
];

export default function ChauffeurService() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(chauffeurSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Chauffeur Service Dubai', href: '/chauffeur-service' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Chauffeur Service in Dubai"
        subtitle="Luxury Chauffeur Service in Dubai"
        text="Book a private chauffeur in Dubai and travel in comfort. Our luxury chauffeur service includes premium vehicles and professional drivers for stress-free journeys."
      />

      <WhyBookEmiratesLimo
        title="Why Choose Our Chauffeur Hire in Dubai?"
        subtitle="Luxury Chauffeur Services Dubai"
        benefits={benefits}
      />

      <Process
        title="Book Your Chauffeur Hire in 4 Easy Steps"
        subtitle="Simple & Convenient"
      />

      <Services
        title="Premium Chauffeur Services in Dubai"
        subtitle="Chauffeur Experiences"
      />

      <Fleet
        title="Luxury Vehicles for Chauffeur Hire Dubai"
        subtitle="Our Fleet"
      />

      <FAQs
        title="Chauffeur Hire Dubai — FAQs"
        subtitle="FAQs"
        faqs={chauffeurFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Luxury Chauffeur Service Dubai"
        subtitle="What Our Clients Say"
        testimonials={chauffeurTestimonials}
      />
    </>
  );
}
