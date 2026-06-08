import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { dubaiTransferFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';
import { dubaiTransferSchema } from '@/data/serviceSchemas';

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
  title: 'Dubai Transfer Service | Emirates Limo',
  description:
    'Book your Dubai transfer with Emirates Limo. Enjoy luxury private transfers, professional chauffeurs, premium vehicles, and 24/7 availability across Dubai and the UAE.',
  alternates: { canonical: 'https://www.emirateslimo.com/dubai-transfer' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Dubai Transfer Service | Emirates Limo',
    description: 'Book your Dubai transfer with Emirates Limo. Enjoy luxury private transfers, professional chauffeurs, premium vehicles, and 24/7 availability across Dubai and the UAE.',
    url: 'https://www.emirateslimo.com/dubai-transfer',
    images: [{
      url: 'https://www.emirateslimo.com/hero-bg.webp',
      width: 1200,
      height: 630,
      alt: 'Dubai Transfer Service — Emirates Limo luxury private transfers',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dubai Transfer Service | Emirates Limo',
    description: 'Book your Dubai transfer with Emirates Limo. Enjoy luxury private transfers, professional chauffeurs, premium vehicles, and 24/7 availability across Dubai and the UAE.',
    images: ['https://www.emirateslimo.com/hero-bg.webp'],
  },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Private Vehicles',
    text: 'Travel in style with our premium Sedans, SUVs, and Vans — all luxury maintained vehicles with a private chauffeur for your Dubai transfer.',
  },
  {
    icon: LuShieldCheck,
    title: 'Professionally Trained Chauffeurs',
    text: 'Your Dubai transfer is handled by experienced, licensed chauffeurs who provide safe, premium, and discreet transportation across Dubai and the UAE.',
  },
  {
    icon: LuClock,
    title: 'On-Time, Every Time',
    text: 'Enjoy punctual Dubai transfers with real-time flight monitoring, advanced scheduling, and reliable pickup and dropoff — 24/7.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible & Convenient Service',
    text: 'Plans changed? No problem. Enjoy flexible booking options and free cancellation up to 24 hours before your private Dubai transfer.',
  },
];

export default function DubaiTransfer() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dubaiTransferSchema).replace(/</g, '\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbList({ paths: [{ label: 'Home', href: '/' }, { label: 'Dubai Transfer Service', href: '/dubai-transfer' }] })).replace(/</g, '\u003c') }}
      />

      <Hero
        title="Luxury Dubai Transfer Service"
        subtitle="Private, Luxury & 24/7 Transfers"
        text="Book your Dubai transfer with Emirates Limo and experience a luxury private ride with professional chauffeurs, premium vehicles, and seamless airport and city transfers across Dubai and the UAE."
      />

      <WhyBookEmiratesLimo
        title="Why Book Your Dubai Transfer With Emirates Limo?"
        subtitle="Premium Dubai Transfer Benefits"
        benefits={benefits}
      />

      <Process
        title="Book Your Private Dubai Transfer in 4 Easy Steps"
        subtitle="How It Works"
      />

      <Services
        title="Luxury Transfer & Chauffeur Services in Dubai"
        subtitle="Premium Dubai Transfer Services"
      />

      <Fleet
        title="Luxury Vehicles for Dubai Transfers"
        subtitle="Premium Fleet"
      />

      <ServiceCta
        title="Plan your Dubai transfer with Emirates Limo"
        text="Explore chauffeur services or browse our fleet to find the perfect ride."
        primary={{ href: '/chauffeur-service', label: 'Chauffeur Service' }}
        secondary={{ href: '/fleet', label: 'View Fleet' }}
      />

      <FAQs
        title="Dubai Transfer FAQs"
        subtitle="Frequently Asked Questions"
        faqs={dubaiTransferFaqs}
        includeJsonLd
      />

      <Testimonials
        title="Testimonials"
        subtitle="What Our Clients Say"
        testimonials={chauffeurTestimonials}
      />
    </>
  );
}
