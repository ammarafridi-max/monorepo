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
import FAQs from '@/components/HomeComponents/FAQs';
import Testimonials from '@/components/HomeComponents/Testimonials';

export const pageData = {
  meta: {
    title: 'Dubai Airport to Hotel Transfer | Emirates Limo',
    description: 'Book a luxury airport transfer from Dubai Airport to your hotel. Professional chauffeurs, premium vehicles, meet & greet, and on-time pickup in Dubai.',
    canonical: 'https://www.emirateslimo.com/dubai-airport-transfer-to-hotel',
    entityName: 'Dubai Airport Transfer to Hotel',
    areaServed: 'Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Dubai Airport Transfer to Hotel', href: '/dubai-airport-transfer-to-hotel' },
  ],
  sections: {
    hero: {
      title: 'Dubai Airport Transfer to Hotel',
      subtitle: 'Luxury Airport Transfer Dubai, 24/7 Service',
      text: 'Arrive in style with our luxury airport transfer from Dubai Airport to hotel. Enjoy meet & greet service, 60 minutes free waiting time, and professional chauffeurs.',
    },
    intro: {
      question: 'How do I get from Dubai Airport to my hotel with a private chauffeur?',
      answer:
        'Book an Emirates Limo airport to hotel transfer before you fly, give us the flight number and hotel name, and a chauffeur meets you in arrivals with a name board. The price is fixed at booking, the flight is tracked, and 60 minutes of waiting time is included, so a slow queue at immigration costs you nothing.',
      paragraphs: [
        'Most Dubai hotels sit in a handful of areas, and the drive time from DXB varies a lot between them. Deira and Bur Dubai are the closest, Downtown and Business Bay are a short run down Sheikh Zayed Road, while Palm Jumeirah, Dubai Marina and JBR are at the far end of the city and take noticeably longer, especially at rush hour. Flights into Al Maktoum (DWC) land on the opposite side of Dubai, so the Marina and Palm are closer from there and Deira is further.',
        'Your chauffeur knows the hotel entrances, including the resort access roads on the Palm and the drop-off lanes at the big Downtown towers, so there is no circling and no stop at the wrong tower. Luggage goes in the car, not in your hands.',
        'Families and groups should look at the GMC Yukon (six passengers, six bags) or the Mercedes-Benz V-Class. Solo travellers and couples are comfortable in the Lexus ES300 or BMW 7-Series. Child seats are fitted on request when you book.',
      ],
      facts: [
        { label: 'From', value: 'DXB Terminal 1, 2 or 3, or DWC' },
        { label: 'To', value: 'Any hotel, resort or residence in Dubai' },
        { label: 'Meet and greet', value: 'Name board in arrivals, luggage assistance' },
        { label: 'Waiting time', value: '60 minutes free from landing' },
        { label: 'Price', value: 'Fixed at booking, no surge or delay charges' },
      ],
    },
    benefits: {
      title: 'Why Book Your Dubai Airport Transfer to Hotel With Us?',
      subtitle: 'Luxury, Comfort & Reliability',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Airport Transfer in Dubai',
          text: 'Enjoy premium transportation from Dubai Airport to your hotel with luxury Sedans, SUVs, and Vans, all impeccably maintained for maximum comfort.',
        },
        {
          icon: LuShieldCheck,
          title: 'Professional Chauffeurs',
          text: 'Your airport transfer from Dubai Airport to hotel is handled by experienced, well-trained chauffeurs ensuring safety, privacy, and a smooth ride.',
        },
        {
          icon: LuClock,
          title: 'On-Time Pickup & Flight Tracking',
          text: 'We monitor your flight and provide 60 minutes of free waiting time to guarantee a stress-free Dubai airport transfer to hotel.',
        },
        {
          icon: LuCalendarX,
          title: 'Flexible & Easy Booking',
          text: "Plans change, and that's okay. We offer flexible booking and free cancellation up to 24 hours before your Dubai airport transfer.",
        },
      ],
    },
    process: {
      title: 'Book Your Dubai Airport Transfer in 4 Easy Steps',
      subtitle: 'Simple & Hassle-Free',
    },
    services: {
      title: 'Transportation From Dubai Airport to Hotel',
      subtitle: 'Premium Airport Transfer Services',
    },
    fleet: {
      title: 'Luxury Vehicles For Your Airport Transfer',
      subtitle: 'Our Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/dubai-airport-transfer', '/dubai-transfer', '/abu-dhabi-airport-to-dubai-transfer']),
    },
    faqs: {
      title: 'Dubai Airport Transfer to Hotel FAQs',
      subtitle: 'Airport Transfer FAQs',
      faqs: airportTransferFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Dubai Airport Transfer Service',
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
