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
    title: 'Abu Dhabi Airport Transfer | Emirates Limo',
    description: 'Book a luxury Abu Dhabi airport transfer with professional chauffeurs, meet & greet service, and on-time pickup. Premium vehicles for hotel and city transfers.',
    canonical: 'https://www.emirateslimo.com/abu-dhabi-airport-transfer',
    entityName: 'Abu Dhabi Airport Transfer',
    areaServed: 'Abu Dhabi, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Abu Dhabi Airport Transfer', href: '/abu-dhabi-airport-transfer' },
  ],
  sections: {
    hero: {
      title: 'Abu Dhabi Airport Transfer',
      subtitle: 'Luxury Airport Pickup & 24/7 Service',
      text: 'Arrive in style with our premium Abu Dhabi airport transfer: professional chauffeurs, luxury vehicles, meet & greet service, and seamless door-to-door transportation.',
    },
    intro: {
      question: 'How does an Abu Dhabi airport transfer with Emirates Limo work?',
      answer:
        'Your chauffeur meets you inside the arrivals hall at Zayed International Airport (AUH) with a name board, tracks your flight, and includes 60 minutes of free waiting time from landing. The price is fixed when you book, whether you are heading into Abu Dhabi city, to Yas or Saadiyat Island, or on to Dubai.',
      paragraphs: [
        'Zayed International Airport now runs almost every flight through its new Terminal A. It is about 30 kilometres east of the city centre on the Abu Dhabi to Dubai highway, which puts Yas Island and Saadiyat Island closer to the airport than the Corniche is. Tell us your flight number and we handle the terminal and the timing.',
        'For departures we collect you from any address in Abu Dhabi and drop you at the Terminal A kerb. If you are flying out of Dubai instead, the dedicated Abu Dhabi to Dubai airport transfer page covers that route with the same fixed pricing.',
        'The fleet is the same across both cities: sedans for up to four passengers, the GMC Yukon SUV for six, and vans for larger groups or heavy luggage. Cancel 24 hours or more before pickup for a full refund.',
      ],
      facts: [
        { label: 'Airport', value: 'Zayed International Airport (AUH), Terminal A' },
        { label: 'Meeting point', value: 'Inside arrivals, name board' },
        { label: 'Free waiting time', value: '60 minutes from actual landing' },
        { label: 'Popular drop-offs', value: 'Abu Dhabi city, Yas Island, Saadiyat Island, Al Reem' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Book Your Abu Dhabi Airport Transfer With Us?',
      subtitle: 'Comfort, Reliability, Luxury',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Abu Dhabi Airport Transfer Fleet',
          text: 'Travel in comfort with premium Sedans, SUVs, and Vans, perfectly maintained and chauffeur-driven for a smooth airport transfer.',
        },
        {
          icon: LuShieldCheck,
          title: 'Professional Chauffeurs',
          text: 'Your Abu Dhabi airport transfer is handled by experienced, well-trained chauffeurs ensuring safety, privacy, and a relaxed journey.',
        },
        {
          icon: LuClock,
          title: 'On-Time Pickup & Flight Tracking',
          text: 'We monitor your flight and provide 60 minutes of free waiting time to guarantee a stress-free Abu Dhabi airport pickup experience.',
        },
        {
          icon: LuCalendarX,
          title: 'Flexible & Hassle-Free Booking',
          text: "Plans change, and that's okay. Enjoy flexible scheduling and free cancellation up to 24 hours before pickup.",
        },
      ],
    },
    process: {
      title: 'Book Your Abu Dhabi Airport Transfer in 4 Easy Steps',
      subtitle: 'Simple & Hassle-Free',
    },
    services: {
      title: 'Premium Chauffeur Experiences in Abu Dhabi',
      subtitle: 'Our Services',
    },
    fleet: {
      title: 'Luxury Vehicles For Your Airport Transfer',
      subtitle: 'Our Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/abu-dhabi-airport-to-dubai-transfer', '/chauffeur-service-abu-dhabi', '/abu-dhabi-to-dubai-transfer']),
    },
    faqs: {
      title: 'Abu Dhabi Airport Transfer FAQs',
      subtitle: 'Airport Transfer FAQs',
      faqs: abuDhabiAirportFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Abu Dhabi Airport Transfer Service',
      subtitle: 'Client Testimonials',
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
