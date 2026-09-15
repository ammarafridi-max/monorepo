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
import ServiceCta from '@/components/ServiceCta';
import FAQs from '@/components/HomeComponents/FAQs';
import Testimonials from '@/components/HomeComponents/Testimonials';

export const pageData = {
  meta: {
    title: 'Hourly Chauffeur Dubai | Flexible Chauffeur Service',
    description: 'Book hourly chauffeur Dubai service for meetings, shopping, events, and city travel with luxury vehicles and professional drivers on demand.',
    canonical: 'https://www.emirateslimo.com/hourly-chauffeur',
    entityName: 'Hourly Chauffeur Dubai',
    areaServed: 'Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Hourly Chauffeur Dubai', href: '/hourly-chauffeur' },
  ],
  sections: {
    hero: {
      title: 'Hourly Chauffeur Service in Dubai',
      subtitle: 'Flexible Hourly Hire',
      text: 'For ultimate convenience and flexibility, our hourly chauffeur service in Dubai gives you a private driver and luxury vehicle on standby for as long as you need.',
    },
    intro: {
      question: 'How much does an hourly chauffeur in Dubai cost?',
      answer:
        'Emirates Limo hourly chauffeur service starts from AED 150 per hour, with the exact rate shown per vehicle on the booking form and fixed when you book. The chauffeur and car stay with you for the whole booking, you can make as many stops as you like, and waiting between stops is included.',
      paragraphs: [
        'Hourly works out simpler than separate transfers when you have three or more stops in a day: a morning at Dubai Mall, lunch in Jumeirah, meetings in DIFC, or an evening that moves between hotels. There is no re-booking, no waiting for a car to arrive, and your bags stay in the vehicle.',
        'Rates step up by vehicle class. The GMC Yukon SUV is the entry point, the Lexus ES300, BMW 7-Series, Kia Carnival and Mercedes-Benz V-Class sit above it, and the Mercedes-Benz S-Class is the top of the range. Pick the hours you need on the form and the total is shown before you pay.',
        'Bookings can start anywhere in Dubai, including hotels and the airport, and the clock runs from your pickup time. Cancel 24 hours or more before pickup for a full refund.',
      ],
      facts: [
        { label: 'Rate', value: 'From AED 150 per hour, shown per vehicle at booking' },
        { label: 'Stops', value: 'Unlimited, waiting included' },
        { label: 'Minimum', value: 'Choose the number of hours on the booking form' },
        { label: 'Coverage', value: 'Dubai, with Abu Dhabi and Sharjah on request' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Book Your Hourly Chauffeur With Us?',
      subtitle: 'Why Choose Us',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Fleet',
          text: 'Choose from executive sedans, premium SUVs, and luxury vans, always clean and chauffeur-driven.',
        },
        {
          icon: LuShieldCheck,
          title: 'Professional Chauffeurs',
          text: 'Our experienced chauffeurs ensure comfort, privacy, and a smooth journey throughout your rental period.',
        },
        {
          icon: LuClock,
          title: 'Flexible Hourly Packages',
          text: "Pay only for the duration you need, whether it's 2 hours or a full-day hire.",
        },
        {
          icon: LuCalendarX,
          title: 'Flexible Cancellation',
          text: 'Free cancellation when done at least 24 hours before pickup.',
        },
      ],
    },
    process: {
      title: 'Book Your Hourly Chauffeur in 4 Easy Steps',
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
      links: getServiceLinks(['/chauffeur-service', '/car-hire-with-driver-dubai', '/dubai-transfer']),
    },
    cta: {
      title: 'Need a full chauffeur solution?',
      text: 'For full-day and executive travel, explore our main chauffeur service page.',
      primary: { href: '/chauffeur-service', label: 'View Chauffeur Service' },
    },
    faqs: {
      title: 'Hourly Chauffeur Dubai FAQs',
      subtitle: 'FAQs',
      faqs: chauffeurFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Dubai Hourly Chauffeur Service',
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
