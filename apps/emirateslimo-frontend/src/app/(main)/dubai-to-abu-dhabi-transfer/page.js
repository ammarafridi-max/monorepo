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
    title: 'Dubai to Abu Dhabi Transfer | Emirates Limo',
    description: 'Book a luxury private transfer from Dubai to Abu Dhabi. Professional chauffeurs, premium vehicles, comfortable travel, and 24/7 reliable service.',
    canonical: 'https://www.emirateslimo.com/dubai-to-abu-dhabi-transfer',
    entityName: 'Dubai to Abu Dhabi Transfer',
    areaServed: 'Dubai and Abu Dhabi, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Dubai to Abu Dhabi Transfer', href: '/dubai-to-abu-dhabi-transfer' },
  ],
  sections: {
    hero: {
      title: 'Dubai to Abu Dhabi Private Transfer',
      subtitle: 'Luxury, Comfort, Reliability',
      text: 'Travel from Dubai to Abu Dhabi in complete comfort with our private chauffeur service. Premium vehicles, professional drivers, and seamless intercity transportation, perfect for business trips, leisure travel, families, and VIP journeys.',
    },
    intro: {
      question: 'How long does it take to get from Dubai to Abu Dhabi by car?',
      answer:
        'Around 90 minutes from central Dubai to Abu Dhabi city, and closer to an hour if you are only going as far as Yas Island or Zayed International Airport, which sit on the Dubai side of Abu Dhabi. Emirates Limo runs the route door to door, 24/7, with a fixed price at booking and a private vehicle for your party.',
      paragraphs: [
        'From Dubai the E11 Sheikh Zayed Road runs past Jebel Ali and straight down the coast; the E311 inland route is the alternative when the coast road is heavy. Weekday evenings leaving Dubai are the slow window. Whichever road is used, the fare is fixed when you book with Salik and Darb tolls included, so a slow evening on the E11 does not cost you more.',
        'Common bookings are a Dubai hotel to the Sheikh Zayed Grand Mosque and the Louvre for a day out, a corporate run to ADGM, transfers to Yas Marina Circuit for race weekends, and Dubai to AUH for a departure. For a day trip with several stops, the hourly chauffeur service keeps the same car with you.',
        'Choose a sedan for one to four passengers, the GMC Yukon for six, or a van when there is luggage. Child seats are fitted on request.',
      ],
      facts: [
        { label: 'Distance', value: 'About 130 to 140 km to Abu Dhabi city' },
        { label: 'Typical duration', value: 'Around 90 minutes; about an hour to Yas or AUH' },
        { label: 'Roads', value: 'E11 Sheikh Zayed Road or E311, chauffeur decides' },
        { label: 'Price', value: 'All-inclusive, fixed at booking: tolls and taxes included' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Book Your Dubai to Abu Dhabi Transfer With Emirates Limo?',
      subtitle: 'Premium Intercity Travel Experience',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Private Vehicles',
          text: 'Enjoy a smooth Dubai to Abu Dhabi transfer in premium Sedans, SUVs, and Vans, luxury-maintained and chauffeur-driven for maximum comfort.',
        },
        {
          icon: LuShieldCheck,
          title: 'Professionally Trained Chauffeurs',
          text: 'Your Dubai to Abu Dhabi transfer is handled by licensed, highly experienced chauffeurs ensuring safe, discreet, and premium intercity travel.',
        },
        {
          icon: LuClock,
          title: 'On-Time & Reliable Service',
          text: 'We value your time. Expect punctual pickup, carefully planned routes, and seamless Dubai to Abu Dhabi journeys, available 24/7.',
        },
        {
          icon: LuCalendarX,
          title: 'Flexible & Convenient Booking',
          text: 'Plans changed? No worries. Enjoy flexible scheduling and free cancellation up to 24 hours before your private Dubai to Abu Dhabi transfer.',
        },
      ],
    },
    process: {
      title: 'Book Your Dubai to Abu Dhabi Transfer in 4 Easy Steps',
      subtitle: 'Simple & Hassle-Free',
    },
    services: {
      title: 'Luxury Chauffeur & Intercity Transfer Services',
      subtitle: 'Dubai to Abu Dhabi Travel',
    },
    fleet: {
      title: 'Luxury Vehicles For Your Transfer',
      subtitle: 'Premium Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/abu-dhabi-to-dubai-transfer', '/abu-dhabi-airport-transfer', '/dubai-transfer']),
    },
    cta: {
      title: 'Need a transfer within Dubai?',
      text: 'Explore our Dubai transfer services or book a premium chauffeur for your next trip.',
      primary: { href: '/dubai-transfer', label: 'Dubai Transfer' },
      secondary: { href: '/chauffeur-service', label: 'Chauffeur Service' },
    },
    faqs: {
      title: 'Dubai to Abu Dhabi Transfer FAQs',
      subtitle: 'Frequently Asked Questions',
      faqs: dubaiTransferFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Dubai to Abu Dhabi Transfer Service',
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
