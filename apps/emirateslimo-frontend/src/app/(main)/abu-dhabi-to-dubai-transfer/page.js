import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { dubaiTransferFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';
import { abuDhabiToDubaiTransferSchema } from '@/data/serviceSchemas';

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
  title: 'Abu Dhabi to Dubai Transfer | Emirates Limo',
  description:
    'Book a luxury private transfer from Abu Dhabi to Dubai with professional chauffeurs, premium vehicles, and 24/7 reliable service. Comfortable, safe, and discreet travel.',
  alternates: { canonical: 'https://www.emirateslimo.com/abu-dhabi-to-dubai-transfer' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Abu Dhabi to Dubai Transfer | Emirates Limo',
    description: 'Book a luxury private transfer from Abu Dhabi to Dubai with professional chauffeurs, premium vehicles, and 24/7 reliable service. Comfortable, safe, and discreet travel.',
    url: 'https://www.emirateslimo.com/abu-dhabi-to-dubai-transfer',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Abu Dhabi to Dubai Transfer — Emirates Limo private chauffeur service',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abu Dhabi to Dubai Transfer | Emirates Limo',
    description: 'Book a luxury private transfer from Abu Dhabi to Dubai with professional chauffeurs, premium vehicles, and 24/7 reliable service. Comfortable, safe, and discreet travel.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Private Vehicles',
    text: 'Enjoy a smooth Abu Dhabi to Dubai transfer in premium Sedans, SUVs, and Vans — all luxury-maintained and chauffeur-driven for maximum comfort.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professional Chauffeurs',
    text: 'Your Abu Dhabi to Dubai transfer is handled by experienced, licensed chauffeurs ensuring safety, privacy, and a refined travel experience.',
  },
  {
    icon: LuClock,
    title: 'Punctual & Reliable Transfers',
    text: 'We value your time. Expect on-time pickup, carefully planned routes, and seamless Abu Dhabi to Dubai travel — available 24/7.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Convenient Service',
    text: 'Plans changed? No problem. Enjoy flexible booking options and free cancellation up to 24 hours before your scheduled transfer.',
  },
];

export default function AbuDhabiToDubaiTransfer() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(abuDhabiToDubaiTransferSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Abu Dhabi to Dubai Transfer', href: '/abu-dhabi-to-dubai-transfer' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Abu Dhabi to Dubai Private Transfer"
        subtitle="Luxury • Comfort • Reliability"
        text="Travel from Abu Dhabi to Dubai in complete comfort with our private chauffeur service. Premium vehicles, professional drivers, and seamless intercity transportation — perfect for business, leisure, families, and VIP travel."
      />

      <WhyBookEmiratesLimo
        title="Why Book Your Abu Dhabi to Dubai Transfer With Us?"
        subtitle="Premium Intercity Travel Experience"
        benefits={benefits}
      />

      <Process
        title="Book Your Abu Dhabi to Dubai Transfer in 4 Easy Steps"
        subtitle="Simple & Hassle-Free"
      />

      <Services
        title="Luxury Chauffeur & Transfer Services"
        subtitle="Premium Intercity Transport"
      />

      <Fleet
        title="Luxury Vehicles For Your Transfer"
        subtitle="Premium Fleet"
      />

      <ServiceCta
        title="Need a transfer within Dubai?"
        text="Explore our Dubai transfer services or choose a premium chauffeur for your next trip."
        primary={{ href: '/dubai-transfer', label: 'Dubai Transfer' }}
        secondary={{ href: '/chauffeur-service', label: 'Chauffeur Service' }}
      />

      <FAQs
        title="Abu Dhabi to Dubai Transfer – FAQs"
        subtitle="Frequently Asked Questions"
        faqs={dubaiTransferFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Abu Dhabi to Dubai Transfer Service"
        subtitle="What Our Clients Say"
        testimonials={chauffeurTestimonials}
      />
    </>
  );
}
