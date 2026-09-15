import { LuCar, LuShieldCheck, LuClock, LuCalendarX } from 'react-icons/lu';
import { chauffeurFaqs } from '@/data/faqs';
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
import FAQs from '@/components/HomeComponents/FAQs';
import Testimonials from '@/components/HomeComponents/Testimonials';

export const pageData = {
  meta: {
    title: 'Limo Service Dubai | Emirates Limo',
    description: 'Book luxury limo service in Dubai with professional chauffeurs and premium vehicles. Ideal for business travel, airport transfers, events, and VIP transportation.',
    canonical: 'https://www.emirateslimo.com/limo-service-dubai',
    entityName: 'Limo Service Dubai',
    areaServed: 'Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Limo Service Dubai', href: '/limo-service-dubai' },
  ],
  sections: {
    hero: {
      title: 'Limo Service Dubai',
      subtitle: 'Luxury Dubai Limousine Service',
      text: 'Experience first-class travel with our premium Dubai limousine service. Enjoy luxury vehicles, professional chauffeurs, and seamless limo hire for business, travel, events, and VIP journeys across Dubai.',
    },
    intro: {
      question: 'What does a limo service in Dubai actually include?',
      answer:
        'In Dubai, "limo" means a chauffeur-driven luxury sedan, SUV or van rather than a stretch limousine. Emirates Limo limo service is a private Mercedes-Benz S-Class, BMW 7-Series, Lexus ES300, GMC Yukon or Mercedes-Benz V-Class with a professional chauffeur, a fixed price at booking, 24/7 availability and a full refund if you cancel 24 hours or more ahead.',
      paragraphs: [
        'In Dubai the word covers executive cars rather than stretch vehicles. What you are paying for is the standard of car, the chauffeur, and a fixed fare with no meter.Typical bookings are airport arrivals and departures, hotel to venue transfers for events and weddings, corporate guest transport, and evenings out where nobody wants to drive. For several stops in one evening, the hourly service keeps the same car and chauffeur with you.',
        'The Mercedes-Benz S-Class is the flagship for VIP guests; the GMC Yukon and Mercedes-Benz V-Class handle groups of up to six with luggage. Every vehicle is chauffeur-driven; there is no self-drive.',
      ],
      facts: [
        { label: 'Flagship', value: 'Mercedes-Benz S-Class' },
        { label: 'Groups', value: 'GMC Yukon and Mercedes-Benz V-Class, up to 6' },
        { label: 'Booking types', value: 'Transfer, hourly, event and airport' },
        { label: 'Availability', value: '24/7' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Choose Our Limo Service in Dubai?',
      subtitle: 'Luxury Dubai Limousine Experience',
      benefits: [
        {
          icon: LuCar,
          title: 'Premium Limousine Fleet',
          text: 'Enjoy a luxury limo service in Dubai with premium Sedans, SUVs, and executive limousines, all impeccably maintained and chauffeur-driven.',
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
          text: 'Plans changed? No problem. Enjoy flexible limo hire options and free cancellation up to 24 hours before pickup time.',
        },
      ],
    },
    process: {
      title: 'Book Your Dubai Limo Service in 4 Easy Steps',
      subtitle: 'Simple & Convenient',
    },
    services: {
      title: 'Dubai Limousine Service For Every Occasion',
      subtitle: 'Our Limo Services',
    },
    fleet: {
      title: 'Luxury Limousine Vehicles in Dubai',
      subtitle: 'Our Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/chauffeur-service', '/dubai-airport-transfer', '/hourly-chauffeur']),
    },
    faqs: {
      title: 'Limo Service Dubai FAQs',
      subtitle: 'Frequently Asked Questions',
      faqs: chauffeurFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Dubai Limousine Service',
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
