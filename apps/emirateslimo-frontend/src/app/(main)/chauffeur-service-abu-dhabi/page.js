import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { abuDhabiChauffeurSchema } from '@/data/serviceSchemas';
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
  title: 'Abu Dhabi Chauffeur Service | Emirates Limo',
  description:
    'Book luxury Abu Dhabi chauffeur service with professional drivers, premium vehicles, and reliable private transportation. Perfect for business, travel, and VIP journeys.',
  alternates: { canonical: 'https://www.emirateslimo.com/chauffeur-service-abu-dhabi' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Abu Dhabi Chauffeur Service | Emirates Limo',
    description: 'Book luxury Abu Dhabi chauffeur service with professional drivers, premium vehicles, and reliable private transportation. Perfect for business, travel, and VIP journeys.',
    url: 'https://www.emirateslimo.com/chauffeur-service-abu-dhabi',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Abu Dhabi Chauffeur Service — Emirates Limo luxury private driver',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abu Dhabi Chauffeur Service | Emirates Limo',
    description: 'Book luxury Abu Dhabi chauffeur service with professional drivers, premium vehicles, and reliable private transportation. Perfect for business, travel, and VIP journeys.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Chauffeur Fleet',
    text: 'Experience premium travel with our luxury Sedans, SUVs, and Vans — ideal for business travel, events, city journeys, and private chauffeur hire in Abu Dhabi.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professional Chauffeurs',
    text: 'Our Abu Dhabi chauffeurs are highly trained, courteous, and experienced, ensuring complete comfort, privacy, and safety throughout your journey.',
  },
  {
    icon: LuClock,
    title: 'Punctual & Reliable Service',
    text: 'Enjoy on-time chauffeur service in Abu Dhabi with carefully planned routes and real-time monitoring so you never experience delays.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Hassle-Free Booking',
    text: 'Travel plans changed? No problem. Benefit from flexible scheduling and free cancellation up to 24 hours before pickup.',
  },
];

export default function AbuDhabiChauffeurService() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(abuDhabiChauffeurSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Abu Dhabi Chauffeur Service', href: '/chauffeur-service-abu-dhabi' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Luxury Chauffeur Service in Abu Dhabi"
        subtitle="Professional • Private • Premium"
        text="Experience first-class travel with our Abu Dhabi chauffeur service. Enjoy luxury vehicles, discreet professional drivers, and a smooth, comfortable journey."
      />

      <WhyBookEmiratesLimo
        title="Why Choose Our Abu Dhabi Chauffeur Service?"
        subtitle="Premium Chauffeur Experience"
        benefits={benefits}
      />

      <Process
        title="Book Your Abu Dhabi Chauffeur in 4 Easy Steps"
        subtitle="Simple & Convenient"
      />

      <Services
        title="Premium Chauffeur & Limousine Service in Abu Dhabi"
        subtitle="Our Chauffeur Services"
      />

      <Fleet
        title="Luxury Vehicles For Chauffeur Hire"
        subtitle="Our Fleet"
      />

      <FAQs
        title="Commonly Asked Questions"
        subtitle="FAQs"
        faqs={chauffeurFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Chauffeur Services in Abu Dhabi"
        subtitle="Client Testimonials"
        testimonials={chauffeurTestimonials}
      />
    </>
  );
}
