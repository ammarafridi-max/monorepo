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
    title: 'Car Hire With Driver Dubai | Car With Driver for Rent',
    description: 'Book car hire with driver Dubai service for business trips, airport transfers, events, and city travel with professional chauffeurs and luxury vehicles.',
    canonical: 'https://www.emirateslimo.com/car-hire-with-driver-dubai',
    entityName: 'Car Hire With Driver Dubai',
    areaServed: 'Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Car Hire With Driver Dubai', href: '/car-hire-with-driver-dubai' },
  ],
  sections: {
    hero: {
      title: 'Car Hire With Driver in Dubai',
      subtitle: 'Luxury Cars With Professional Drivers',
      text: 'Book a premium car hire with driver in Dubai and travel in comfort with expert chauffeurs, luxury vehicles, and reliable service across the UAE.',
    },
    intro: {
      question: 'Can I hire a car with a driver in Dubai instead of renting?',
      answer:
        'Yes. Emirates Limo car hire with driver gives you a luxury car and a licensed chauffeur for a transfer, a few hours or a full day, with the price fixed at booking. You never drive, insure, park or refuel anything, and there is no deposit, licence check or fuel return as there would be with a rental.',
      paragraphs: [
        'Visitors often assume a rental is cheaper until they add parking at the malls and hotels, Salik tolls, fuel, insurance excess and the time spent navigating. With a driver the car waits where you are, the fare is fixed before you travel, and you can work or rest on the move. It also removes the question of whether your home licence is accepted for driving in the UAE.',
        'The service suits airport arrivals, day trips to Abu Dhabi or Sharjah, shopping days, and business visits with a run of meetings. For multiple stops, book by the hour; for A to B, book a transfer.',
        'Vehicles are chauffeur-driven only. The fleet covers sedans (Lexus ES300, BMW 7-Series, Mercedes-Benz S-Class), the GMC Yukon SUV and two vans for groups. Child seats are available on request.',
      ],
      facts: [
        { label: 'What you get', value: 'Car plus licensed chauffeur, fuel included' },
        { label: 'Not needed', value: 'Driving licence, deposit, insurance excess' },
        { label: 'Booking types', value: 'Transfer, hourly, full day' },
        { label: 'Coverage', value: 'Dubai and the UAE' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Choose Our Car Hire With Driver in Dubai?',
      subtitle: 'Why Book With Emirates Limo',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Cars With Professional Drivers',
          text: 'Hire a luxury car with driver in Dubai and enjoy premium comfort in our Sedans, SUVs, and Vans, all impeccably maintained and ready when you are.',
        },
        {
          icon: LuShieldCheck,
          title: 'Trained & Experienced Drivers',
          text: 'Every car with driver for rent in Dubai is handled by a professional, well-trained chauffeur who ensures privacy, safety, and a smooth journey.',
        },
        {
          icon: LuClock,
          title: 'Punctual & Reliable Service',
          text: 'Our Dubai car hire with driver service guarantees on-time pickups, real-time tracking, and perfectly planned journeys for stress-free travel.',
        },
        {
          icon: LuCalendarX,
          title: 'Flexible & Hassle-Free Booking',
          text: "Plans change, and that's okay. Enjoy flexible scheduling and free cancellation up to 24 hours before your trip.",
        },
      ],
    },
    process: {
      title: 'Book Your Car With Driver in 4 Easy Steps',
      subtitle: 'Simple & Fast Booking',
    },
    services: {
      title: 'Car With Driver for Rent in Dubai, Perfect For Every Need',
      subtitle: 'Our Chauffeur Services',
    },
    fleet: {
      title: 'Choose Your Luxury Car With Driver',
      subtitle: 'Our Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/hourly-chauffeur', '/chauffeur-service', '/limo-service-dubai']),
    },
    faqs: {
      title: 'Car Hire With Driver Dubai FAQs',
      subtitle: 'FAQs',
      faqs: chauffeurFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Dubai Car Hire With Driver Service',
      subtitle: 'Client Testimonials',
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
