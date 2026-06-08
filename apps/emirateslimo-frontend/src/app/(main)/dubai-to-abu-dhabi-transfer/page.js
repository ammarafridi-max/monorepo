import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { dubaiTransferFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';
import { dubaiToAbuDhabiTransferSchema } from '@/data/serviceSchemas';

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
  title: 'Dubai to Abu Dhabi Transfer | Emirates Limo',
  description:
    'Book a luxury private transfer from Dubai to Abu Dhabi. Professional chauffeurs, premium vehicles, comfortable travel, and 24/7 reliable service.',
  alternates: { canonical: 'https://www.emirateslimo.com/dubai-to-abu-dhabi-transfer' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Dubai to Abu Dhabi Transfer | Emirates Limo',
    description: 'Book a luxury private transfer from Dubai to Abu Dhabi. Professional chauffeurs, premium vehicles, comfortable travel, and 24/7 reliable service.',
    url: 'https://www.emirateslimo.com/dubai-to-abu-dhabi-transfer',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Dubai to Abu Dhabi Transfer — Emirates Limo private chauffeur service',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dubai to Abu Dhabi Transfer | Emirates Limo',
    description: 'Book a luxury private transfer from Dubai to Abu Dhabi. Professional chauffeurs, premium vehicles, comfortable travel, and 24/7 reliable service.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Private Vehicles',
    text: 'Enjoy a smooth Dubai to Abu Dhabi transfer in premium Sedans, SUVs, and Vans — luxury-maintained and chauffeur-driven for maximum comfort.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professionally Trained Chauffeurs',
    text: 'Your Dubai to Abu Dhabi transfer is handled by licensed, highly experienced chauffeurs ensuring safe, discreet, and premium intercity travel.',
  },
  {
    icon: LuClock,
    title: 'On-Time & Reliable Service',
    text: 'We value your time. Expect punctual pickup, carefully planned routes, and seamless Dubai to Abu Dhabi journeys — available 24/7.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Convenient Booking',
    text: 'Plans changed? No worries. Enjoy flexible scheduling and free cancellation up to 24 hours before your private Dubai to Abu Dhabi transfer.',
  },
];

export default function DubaiToAbuDhabiTransfer() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dubaiToAbuDhabiTransferSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Dubai to Abu Dhabi Transfer', href: '/dubai-to-abu-dhabi-transfer' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Dubai to Abu Dhabi Private Transfer"
        subtitle="Luxury • Comfort • Reliability"
        text="Travel from Dubai to Abu Dhabi in complete comfort with our private chauffeur service. Premium vehicles, professional drivers, and seamless intercity transportation — perfect for business trips, leisure travel, families, and VIP journeys."
      />

      <WhyBookEmiratesLimo
        title="Why Book Your Dubai to Abu Dhabi Transfer With Emirates Limo?"
        subtitle="Premium Intercity Travel Experience"
        benefits={benefits}
      />

      <Process
        title="Book Your Dubai to Abu Dhabi Transfer in 4 Easy Steps"
        subtitle="Simple & Hassle-Free"
      />

      <Services
        title="Luxury Chauffeur & Intercity Transfer Services"
        subtitle="Dubai to Abu Dhabi Travel"
      />

      <Fleet
        title="Luxury Vehicles For Your Transfer"
        subtitle="Premium Fleet"
      />

      <ServiceCta
        title="Need a transfer within Dubai?"
        text="Explore our Dubai transfer services or book a premium chauffeur for your next trip."
        primary={{ href: '/dubai-transfer', label: 'Dubai Transfer' }}
        secondary={{ href: '/chauffeur-service', label: 'Chauffeur Service' }}
      />

      <FAQs
        title="Dubai to Abu Dhabi Transfer – FAQs"
        subtitle="Frequently Asked Questions"
        faqs={dubaiTransferFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Trusted Dubai to Abu Dhabi Transfer Service"
        subtitle="What Our Clients Say"
        testimonials={chauffeurTestimonials}
      />
    </>
  );
}
