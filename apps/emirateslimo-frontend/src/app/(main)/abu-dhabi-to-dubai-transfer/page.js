import { LuCar, LuShieldCheck, LuClock, LuCalendarX } from 'react-icons/lu';
import { dubaiTransferFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';
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
import ServiceCta from '@/components/ServiceCta';
import FAQs from '@/components/HomeComponents/FAQs';
import Testimonials from '@/components/HomeComponents/Testimonials';

export const pageData = {
  meta: {
    title: 'Abu Dhabi to Dubai Transfer | Emirates Limo',
    description: 'Book a luxury private transfer from Abu Dhabi to Dubai with professional chauffeurs, premium vehicles, and 24/7 reliable service. Comfortable, safe, and discreet travel.',
    canonical: 'https://www.emirateslimo.com/abu-dhabi-to-dubai-transfer',
    entityName: 'Abu Dhabi to Dubai Transfer',
    areaServed: 'Abu Dhabi and Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Abu Dhabi to Dubai Transfer', href: '/abu-dhabi-to-dubai-transfer' },
  ],
  sections: {
    hero: {
      title: 'Abu Dhabi to Dubai Private Transfer',
      subtitle: 'Luxury, Comfort, Reliability',
      text: 'Travel from Abu Dhabi to Dubai in complete comfort with our private chauffeur service. Premium vehicles, professional drivers, and seamless intercity transportation, perfect for business, leisure, families, and VIP travel.',
    },
    intro: {
      question: 'How long is the drive from Abu Dhabi to Dubai?',
      answer:
        'Around 90 minutes for the roughly 130 to 140 kilometre run from Abu Dhabi city to central Dubai, and up to two hours in peak traffic or when your destination is Dubai Marina or the Palm. Emirates Limo runs the route door to door, 24/7, in a private vehicle with the price fixed at booking.',
      paragraphs: [
        'Two highways link the cities: the E11 Sheikh Zayed Road along the coast and the E311 Sheikh Mohammed bin Zayed Road inland. Your chauffeur chooses on the day based on live traffic. Weekday mornings towards Dubai are the busiest window, and Friday evenings can be slow in both directions.',
        'A typical booking is a hotel in Abu Dhabi to a Dubai hotel, or Abu Dhabi to a Dubai office for a day of meetings with a return in the evening. Book the return with the same chauffeur and the car waits for you; the hourly service covers a day that includes stops in between.',
        'Solo travellers and couples fit the sedans; the GMC Yukon carries six with luggage; the Kia Carnival and Mercedes-Benz V-Class suit families.',
      ],
      facts: [
        { label: 'Distance', value: 'About 130 to 140 km' },
        { label: 'Typical duration', value: 'Around 90 minutes, up to 2 hours at peak' },
        { label: 'Roads', value: 'E11 Sheikh Zayed Road or E311, chauffeur decides' },
        { label: 'Price', value: 'All-inclusive, fixed at booking: tolls and taxes included' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Book Your Abu Dhabi to Dubai Transfer With Us?',
      subtitle: 'Premium Intercity Travel Experience',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Private Vehicles',
          text: 'Enjoy a smooth Abu Dhabi to Dubai transfer in premium Sedans, SUVs, and Vans, all luxury-maintained and chauffeur-driven for maximum comfort.',
        },
        {
          icon: LuShieldCheck,
          title: 'Professional Chauffeurs',
          text: 'Your Abu Dhabi to Dubai transfer is handled by experienced, licensed chauffeurs ensuring safety, privacy, and a refined travel experience.',
        },
        {
          icon: LuClock,
          title: 'Punctual & Reliable Transfers',
          text: 'We value your time. Expect on-time pickup, carefully planned routes, and seamless Abu Dhabi to Dubai travel, available 24/7.',
        },
        {
          icon: LuCalendarX,
          title: 'Flexible & Convenient Service',
          text: 'Plans changed? No problem. Enjoy flexible booking options and free cancellation up to 24 hours before your scheduled transfer.',
        },
      ],
    },
    process: {
      title: 'Book Your Abu Dhabi to Dubai Transfer in 4 Easy Steps',
      subtitle: 'Simple & Hassle-Free',
    },
    services: {
      title: 'Luxury Chauffeur & Transfer Services',
      subtitle: 'Premium Intercity Transport',
    },
    fleet: {
      title: 'Luxury Vehicles For Your Transfer',
      subtitle: 'Premium Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/dubai-to-abu-dhabi-transfer', '/abu-dhabi-airport-to-dubai-transfer', '/dubai-transfer']),
    },
    cta: {
      title: 'Need a transfer within Dubai?',
      text: 'Explore our Dubai transfer services or choose a premium chauffeur for your next trip.',
      primary: { href: '/dubai-transfer', label: 'Dubai Transfer' },
      secondary: { href: '/chauffeur-service', label: 'Chauffeur Service' },
    },
    faqs: {
      title: 'Abu Dhabi to Dubai Transfer FAQs',
      subtitle: 'Frequently Asked Questions',
      faqs: dubaiTransferFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Abu Dhabi to Dubai Transfer Service',
      subtitle: 'What Our Clients Say',
      testimonials: chauffeurTestimonials,
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
      <ServiceCta
        title={pageData.sections.cta.title}
        text={pageData.sections.cta.text}
        primary={pageData.sections.cta.primary}
        secondary={pageData.sections.cta.secondary}
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
