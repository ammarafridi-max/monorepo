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
    title: 'Dubai Transfer Service | Emirates Limo',
    description: 'Book your Dubai transfer with Emirates Limo. Enjoy luxury private transfers, professional chauffeurs, premium vehicles, and 24/7 availability across Dubai and the UAE.',
    canonical: 'https://www.emirateslimo.com/dubai-transfer',
    entityName: 'Dubai Transfer Service',
    areaServed: 'Dubai, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Dubai Transfer', href: '/dubai-transfer' },
  ],
  sections: {
    hero: {
      title: 'Luxury Dubai Transfer Service',
      subtitle: 'Private, Luxury & 24/7 Transfers',
      text: 'Book your Dubai transfer with Emirates Limo and experience a luxury private ride with professional chauffeurs, premium vehicles, and seamless airport and city transfers across Dubai and the UAE.',
    },
    intro: {
      question: 'What is a Dubai transfer and when should I book one?',
      answer:
        'A Dubai transfer is a private, chauffeur-driven ride between two addresses in Dubai, booked in advance at a fixed price. Book one when you want a guaranteed car at a set time: hotel to airport, hotel to a venue, a business district run, or a late night return, without a meter, an app surge or a wait at the taxi rank.',
      paragraphs: [
        'Point to point in Dubai is mostly a question of Sheikh Zayed Road. Deira, Bur Dubai and Downtown sit at one end, the Marina, JBR and Palm Jumeirah at the other, with DIFC and Business Bay in between. Your chauffeur picks the route on the day, including the parallel Al Khail and Mohammed bin Zayed roads when the E11 is slow, and the fare you booked is the fare you pay.',
        'Transfers are private: the vehicle carries your party only. Pickups include 15 minutes of free waiting time, and the chauffeur will call or message on arrival. For a return journey, book both legs together; for several stops, the hourly chauffeur service is the better fit.',
        'Transfers to Abu Dhabi, Sharjah and the other emirates are available too, with dedicated pages for the Dubai to Abu Dhabi route in each direction.',
      ],
      facts: [
        { label: 'Type', value: 'Private, chauffeur-driven, one party per vehicle' },
        { label: 'Waiting time', value: '15 minutes free at pickup' },
        { label: 'Price', value: 'Fixed at booking, no surge' },
        { label: 'Coverage', value: 'All of Dubai, plus Abu Dhabi and Sharjah' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Book Your Dubai Transfer With Emirates Limo?',
      subtitle: 'Premium Dubai Transfer Benefits',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Private Vehicles',
          text: 'Travel in style with our premium Sedans, SUVs, and Vans, all luxury maintained vehicles with a private chauffeur for your Dubai transfer.',
        },
        {
          icon: LuShieldCheck,
          title: 'Professionally Trained Chauffeurs',
          text: 'Your Dubai transfer is handled by experienced, licensed chauffeurs who provide safe, premium, and discreet transportation across Dubai and the UAE.',
        },
        {
          icon: LuClock,
          title: 'On-Time, Every Time',
          text: 'Enjoy punctual Dubai transfers with real-time flight monitoring, advanced scheduling, and reliable pickup and dropoff, 24/7.',
        },
        {
          icon: LuCalendarX,
          title: 'Flexible & Convenient Service',
          text: 'Plans changed? No problem. Enjoy flexible booking options and free cancellation up to 24 hours before your private Dubai transfer.',
        },
      ],
    },
    process: {
      title: 'Book Your Private Dubai Transfer in 4 Easy Steps',
      subtitle: 'How It Works',
    },
    services: {
      title: 'Luxury Transfer & Chauffeur Services in Dubai',
      subtitle: 'Premium Dubai Transfer Services',
    },
    fleet: {
      title: 'Luxury Vehicles for Dubai Transfers',
      subtitle: 'Premium Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/dubai-airport-transfer', '/dubai-to-abu-dhabi-transfer', '/abu-dhabi-to-dubai-transfer']),
    },
    cta: {
      title: 'Plan your Dubai transfer with Emirates Limo',
      text: 'Explore chauffeur services or browse our fleet to find the perfect ride.',
      primary: { href: '/chauffeur-service', label: 'Chauffeur Service' },
      secondary: { href: '/fleet', label: 'View Fleet' },
    },
    faqs: {
      title: 'Dubai Transfer FAQs',
      subtitle: 'Frequently Asked Questions',
      faqs: dubaiTransferFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Testimonials',
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
