import { LuCar, LuShieldCheck, LuClock, LuCalendarX } from 'react-icons/lu';
import { abuDhabiAirportFaqs } from '@/data/faqs';
import { airportTransferTestimonials } from '@/data/testimonials';
import { getServiceLinks } from '@/data/serviceLinks';
import {
  buildFAQPage,
  buildGraph,
  buildMetadata,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import ServiceIntro from '@/components/Sections/ServiceIntro';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Process from '@/components/HomeComponents/Process';
import Services from '@/components/HomeComponents/Services';
import Fleet from '@/components/HomeComponents/Fleet';
import RelatedServices from '@/components/Sections/RelatedServices';
import FAQs from '@/components/HomeComponents/FAQs';
import Testimonials from '@/components/HomeComponents/Testimonials';

export const pageData = {
  meta: {
    title: 'Abu Dhabi to Dubai Airport Transfer | Emirates Limo',
    description: 'Book a luxury Abu Dhabi to Dubai Airport transfer with professional chauffeurs, premium vehicles, and reliable on-time service. Perfect for departures to DXB or DWC.',
    canonical: 'https://www.emirateslimo.com/abu-dhabi-airport-to-dubai-transfer',
    entityName: 'Abu Dhabi to Dubai Airport Transfer',
    areaServed: 'Abu Dhabi and Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Abu Dhabi to Dubai Airport Transfer', href: '/abu-dhabi-airport-to-dubai-transfer' },
  ],
  sections: {
    hero: {
      title: 'Abu Dhabi to Dubai Airport Transfer',
      subtitle: 'Luxury, Reliable, On Time',
      text: 'Enjoy a smooth and stress-free Abu Dhabi to Dubai Airport transfer with Emirates Limo. Our professional chauffeurs, premium vehicles, and perfectly timed service ensure you arrive at Dubai Airport comfortably and on schedule.',
    },
    intro: {
      question: 'How long does an Abu Dhabi to Dubai Airport transfer take?',
      answer:
        'Plan for around 90 minutes door to door from Abu Dhabi city to Dubai International (DXB), and a little less to Al Maktoum (DWC), which sits on the Abu Dhabi side of Dubai. Emirates Limo times the pickup to your flight, fixes the price at booking, and drives you in a private vehicle straight to your terminal.',
      paragraphs: [
        'The route is the Sheikh Zayed Road (E11) or the Sheikh Mohammed bin Zayed Road (E311) corridor, roughly 130 to 140 kilometres depending on where in Abu Dhabi you start. Weekday mornings towards Dubai and weekday evenings towards Abu Dhabi are the slow periods, so for a morning departure from DXB we recommend leaving earlier than the 90 minute estimate. Your chauffeur monitors traffic and picks the faster of the two highways on the day.',
        'The fare is fixed when you book. Heavy traffic on the day, a slow queue at the airport or a late change of terminal does not change what you pay.',
        'If you are flying out of DWC, tell us at booking: it is nearer to Jebel Ali than to Dubai city, so the drive is shorter and the pickup time changes accordingly. Airport drop-offs go to the departures kerb for your airline.',
      ],
      facts: [
        { label: 'Route', value: 'Abu Dhabi to DXB or DWC via E11 or E311' },
        { label: 'Distance', value: 'About 130 to 140 km to DXB' },
        { label: 'Typical duration', value: 'Around 90 minutes, longer at peak hours' },
        { label: 'Price', value: 'Fixed at booking, no traffic surcharge' },
        { label: 'Pickup', value: 'Timed to your departure, any Abu Dhabi address' },
      ],
    },
    benefits: {
      title: 'Why Book Your Abu Dhabi to Dubai Airport Transfer With Us?',
      subtitle: 'Premium Airport Travel Experience',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Private Airport Transfers',
          text: 'Travel from Abu Dhabi to Dubai Airport in premium Sedans, SUVs, and Vans, luxury-maintained, spacious, and chauffeur-driven for maximum comfort.',
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
          text: 'Travel plans changed? No worries. Enjoy flexible scheduling and free cancellation up to 24 hours before your airport transfer.',
        },
      ],
    },
    process: {
      title: 'Book Your Abu Dhabi to Dubai Airport Transfer in 4 Easy Steps',
      subtitle: 'Simple & Hassle-Free',
    },
    services: {
      title: 'Premium Airport Chauffeur Services',
      subtitle: 'Luxury Airport Transport',
    },
    fleet: {
      title: 'Luxury Vehicles For Airport Transfers',
      subtitle: 'Premium Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/abu-dhabi-airport-transfer', '/abu-dhabi-to-dubai-transfer', '/dubai-airport-transfer']),
    },
    faqs: {
      title: 'Abu Dhabi to Dubai Airport Transfer FAQs',
      subtitle: 'Frequently Asked Questions',
      faqs: abuDhabiAirportFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Airport Transfer Service',
      subtitle: 'What Our Clients Say',
      testimonials: airportTransferTestimonials,
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(pageData.meta),
    buildService({
      canonical: pageData.meta.canonical,
      name: pageData.meta.entityName,
      description: pageData.meta.description,
      areaServed: pageData.meta.areaServed,
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: pageData.sections.faqs.title,
      description: pageData.meta.description,
      faqs: pageData.sections.faqs.faqs,
    }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <Hero
        title={pageData.sections.hero.title}
        subtitle={pageData.sections.hero.subtitle}
        text={pageData.sections.hero.text}
        breadcrumbPaths={pageData.breadcrumbPaths}
      />
      <ServiceIntro
        question={pageData.sections.intro.question}
        answer={pageData.sections.intro.answer}
        paragraphs={pageData.sections.intro.paragraphs}
        facts={pageData.sections.intro.facts}
      />
      <WhyBookEmiratesLimo
        title={pageData.sections.benefits.title}
        subtitle={pageData.sections.benefits.subtitle}
        benefits={pageData.sections.benefits.benefits}
      />
      <Process title={pageData.sections.process.title} subtitle={pageData.sections.process.subtitle} />
      <Services title={pageData.sections.services.title} subtitle={pageData.sections.services.subtitle} />
      <Fleet title={pageData.sections.fleet.title} subtitle={pageData.sections.fleet.subtitle} />
      <RelatedServices
        title={pageData.sections.related.title}
        subtitle={pageData.sections.related.subtitle}
        links={pageData.sections.related.links}
      />
      <FAQs
        title={pageData.sections.faqs.title}
        subtitle={pageData.sections.faqs.subtitle}
        faqs={pageData.sections.faqs.faqs}
      />
      <Testimonials
        title={pageData.sections.testimonials.title}
        subtitle={pageData.sections.testimonials.subtitle}
        testimonials={pageData.sections.testimonials.testimonials}
      />
    </>
  );
}
