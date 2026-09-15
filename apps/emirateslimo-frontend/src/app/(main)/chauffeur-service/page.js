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
    title: 'Chauffeur Service Dubai | Private Chauffeur & Luxury Rides',
    description: 'Book chauffeur service in Dubai with private drivers and luxury vehicles. Professional rides for business travel, events, airport transfers, and city trips.',
    canonical: 'https://www.emirateslimo.com/chauffeur-service',
    entityName: 'Chauffeur Service Dubai',
    areaServed: 'Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Chauffeur Service', href: '/chauffeur-service' },
  ],
  sections: {
    hero: {
      title: 'Chauffeur Service in Dubai',
      subtitle: 'Luxury Chauffeur Service in Dubai',
      text: 'Book a private chauffeur in Dubai and travel in comfort. Our luxury chauffeur service includes premium vehicles and professional drivers for stress-free journeys.',
    },
    intro: {
      question: 'What is included in a chauffeur service in Dubai?',
      answer:
        'A private, chauffeur-driven luxury car reserved for you, with a professional, licensed driver who handles the route, the parking and the luggage. Emirates Limo books by the transfer or by the hour, fixes the price when you book, runs 24/7, and refunds in full if you cancel 24 hours or more before pickup.',
      paragraphs: [
        'The difference from a taxi is that the car and driver are yours for the booking. There is no meter, no app surge, and nobody else in the vehicle. The difference from a rental is that you never drive, park or navigate. For a meeting in DIFC, a dinner in Downtown or a full day of appointments, that is the point.',
        'Chauffeurs are trained in defensive driving, route planning and VIP handling, and they are used to the practicalities of Dubai: tower drop-off lanes, hotel porte-cochères, event entrances and the timing of Sheikh Zayed Road at rush hour. The cabin is kept quiet unless you want to talk.',
        'Book a single transfer, a return, or use the hourly chauffeur service when you have several stops. The fleet runs from the Lexus ES300 and BMW 7-Series to the Mercedes-Benz S-Class, with the GMC Yukon and Mercedes-Benz V-Class for groups.',
      ],
      facts: [
        { label: 'Booking types', value: 'Single transfer, return, or hourly' },
        { label: 'Availability', value: '24 hours a day, every day' },
        { label: 'Waiting time', value: '15 minutes free at non-airport pickups' },
        { label: 'Pricing', value: 'Fixed at booking, no surge' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Choose Our Chauffeur Hire in Dubai?',
      subtitle: 'Luxury Chauffeur Services Dubai',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Chauffeur Fleet',
          text: 'Choose from premium Sedans, SUVs, and Vans for your chauffeur hire in Dubai, impeccably maintained, spacious, and chauffeur-driven.',
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
      ],
    },
    process: {
      title: 'Book Your Chauffeur Hire in 4 Easy Steps',
      subtitle: 'Simple & Convenient',
    },
    services: {
      title: 'Premium Chauffeur Services in Dubai',
      subtitle: 'Chauffeur Experiences',
    },
    fleet: {
      title: 'Luxury Vehicles for Chauffeur Hire Dubai',
      subtitle: 'Our Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/hourly-chauffeur', '/car-hire-with-driver-dubai', '/limo-service-dubai']),
    },
    faqs: {
      title: 'Chauffeur Hire Dubai FAQs',
      subtitle: 'FAQs',
      faqs: chauffeurFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Luxury Chauffeur Service Dubai',
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
