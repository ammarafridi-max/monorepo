import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { limoServiceDubaiSchema } from '@/data/serviceSchemas';
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
  title: { absolute: 'Limo Service Dubai | Emirates Limo' },
  description:
    'Book luxury limo service in Dubai with professional chauffeurs and premium vehicles. Ideal for business travel, airport transfers, events, and VIP transportation.',
  alternates: { canonical: 'https://www.emirateslimo.com/limo-service-dubai' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Limo Service Dubai | Emirates Limo',
    description: 'Book luxury limo service in Dubai with professional chauffeurs and premium vehicles. Ideal for business travel, airport transfers, events, and VIP transportation.',
    url: 'https://www.emirateslimo.com/limo-service-dubai',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Limo Service Dubai — Emirates Limo luxury limousine and chauffeur',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Limo Service Dubai | Emirates Limo',
    description: 'Book luxury limo service in Dubai with professional chauffeurs and premium vehicles. Ideal for business travel, airport transfers, events, and VIP transportation.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Premium Limousine Fleet',
    text: 'Enjoy a luxury limo service in Dubai with premium Sedans, SUVs, and executive limousines — all impeccably maintained and chauffeur-driven.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professional Chauffeurs',
    text: 'Our highly trained and courteous limousine chauffeurs deliver a safe, private, and first-class Dubai limousine service experience.',
  },
  {
    icon: LuClock,
    title: 'On-Time & Reliable',
    text: 'Experience punctual Dubai limo service with carefully planned routes, reliable pickups, and smooth journey from start to finish.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible Booking & Cancellation',
    text: "Plans changed? No problem. Enjoy flexible limo hire options and free cancellation up to 24 hours before pickup time.",
  },
];

export default function LimoServiceDubai() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(limoServiceDubaiSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Limo Service Dubai', href: '/limo-service-dubai' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Limo Service Dubai"
        subtitle="Luxury Dubai Limousine Service"
        text="Experience first-class travel with our premium Dubai limousine service. Enjoy luxury vehicles, professional chauffeurs, and seamless limo hire for business, travel, events, and VIP journeys across Dubai."
      />

      <WhyBookEmiratesLimo
        title="Why Choose Our Limo Service in Dubai?"
        subtitle="Luxury Dubai Limousine Experience"
        benefits={benefits}
      />

      <Process
        title="Book Your Dubai Limo Service in 4 Easy Steps"
        subtitle="Simple & Convenient"
      />

      <Services
        title="Dubai Limousine Service For Every Occasion"
        subtitle="Our Limo Services"
      />

      <Fleet
        title="Luxury Limousine Vehicles in Dubai"
        subtitle="Our Fleet"
      />

      <FAQs
        title="Limo Service Dubai — FAQs"
        subtitle="Frequently Asked Questions"
        faqs={chauffeurFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Dubai Limousine Service"
        subtitle="What Our Clients Say"
        testimonials={chauffeurTestimonials}
      />
    </>
  );
}
