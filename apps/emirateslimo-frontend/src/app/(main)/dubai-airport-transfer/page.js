import { LuCar, LuShieldCheck, LuClock, LuCalendarX } from 'react-icons/lu';
import { airportTransferFaqs } from '@/data/faqs';
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
import ServiceCta from '@/components/ServiceCta';
import FAQs from '@/components/HomeComponents/FAQs';
import Testimonials from '@/components/HomeComponents/Testimonials';

export const pageData = {
  meta: {
    title: 'Dubai Airport Transfer | Emirates Limo Pickup & Dropoff',
    description: 'Book Dubai airport transfer with Emirates Limo for luxury pickup and dropoff service, professional chauffeurs, and instant booking confirmation.',
    canonical: 'https://www.emirateslimo.com/dubai-airport-transfer',
    entityName: 'Dubai Airport Transfer',
    areaServed: 'Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Dubai Airport Transfer', href: '/dubai-airport-transfer' },
  ],
  sections: {
    hero: {
      title: 'Dubai Airport Transfer',
      subtitle: '60 Mins Waiting Time, 24/7 Service',
      text: 'Step off the plane and into a chauffeur-driven luxury vehicle. Discreet service, professional chauffeurs, and seamless airport transfers.',
    },
    intro: {
      question: 'How does a private Dubai airport transfer with Emirates Limo work?',
      answer:
        'You book online with a fixed price, your chauffeur tracks the flight and waits in the arrivals hall with a name board, and you get 60 minutes of free waiting time from the moment the plane lands. The car is reserved for you alone, and the price does not change for traffic or delays.',
      paragraphs: [
        'Dubai International (DXB) has three terminals. Terminal 3 is used by Emirates and flydubai codeshares, Terminal 2 by most flydubai flights and smaller carriers, and Terminal 1 by the majority of other international airlines. Tell us your flight number when you book and we send the chauffeur to the right arrivals hall. Al Maktoum International (DWC) in Dubai South is covered too.',
        'Meet and greet is standard. The chauffeur is inside arrivals holding a board with your name, helps with luggage, and walks you to the vehicle. If immigration is slow, the 60 minutes of free waiting time is there to absorb it. For departures, we collect you from any address in Dubai and drop you at the terminal kerb for your airline.',
        'Choose the vehicle by group size: the Lexus ES300, BMW 7-Series and Mercedes-Benz S-Class for one to four passengers, the GMC Yukon for up to six, or the Kia Carnival and Mercedes-Benz V-Class when there is more luggage. Cancel 24 hours or more before pickup for a full refund.',
      ],
      facts: [
        { label: 'Airports covered', value: 'Dubai International (DXB) all terminals, Al Maktoum International (DWC)' },
        { label: 'Free waiting time', value: '60 minutes from actual landing time' },
        { label: 'Meeting point', value: 'Inside the arrivals hall, name board' },
        { label: 'Flight tracking', value: 'Included, pickup time adjusts automatically' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Book Your Dubai Airport Transfer With Us?',
      subtitle: 'Why Choose Us',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Fleet',
          text: 'Experience ultimate comfort in our luxury Sedans, SUVs, and Vans, all impeccably maintained and chauffeur-driven.',
        },
        {
          icon: LuShieldCheck,
          title: 'Experienced Chauffeurs',
          text: 'Our professional chauffeurs ensure a safe, comfortable, private, and punctual ride, every time, for every traveler.',
        },
        {
          icon: LuClock,
          title: 'Always On Time',
          text: 'Your time is important to us. We offer real-time tracking and pre-scheduled bookings to ensure timely pickup and dropoff.',
        },
        {
          icon: LuCalendarX,
          title: 'Flexible Cancellation',
          text: 'Plans change, and we understand. Receive 100% refund when you cancel at least 24 hours before the pick up time.',
        },
      ],
    },
    process: {
      title: 'Book Your Airport Transfer in 4 Easy Steps',
      subtitle: 'Our Process',
    },
    services: {
      title: 'Premium Chauffeur Experiences in Dubai',
      subtitle: 'Our Services',
    },
    fleet: {
      title: 'Luxury Vehicles To Choose From',
      subtitle: 'Our Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/dubai-airport-transfer-to-hotel', '/abu-dhabi-airport-transfer', '/dubai-transfer']),
    },
    cta: {
      title: 'Ready to book your Dubai airport transfer?',
      text: 'Choose your vehicle from our luxury fleet or start your booking in minutes.',
      primary: { href: '/book/select-limo', label: 'Start Booking' },
      secondary: { href: '/fleet', label: 'View Fleet' },
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Airport Transfer FAQs',
      faqs: airportTransferFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'What Our Clients Say',
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
