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
    title: 'Abu Dhabi Chauffeur Service | Emirates Limo',
    description: 'Book luxury Abu Dhabi chauffeur service with professional drivers, premium vehicles, and reliable private transportation. Perfect for business, travel, and VIP journeys.',
    canonical: 'https://www.emirateslimo.com/chauffeur-service-abu-dhabi',
    entityName: 'Abu Dhabi Chauffeur Service',
    areaServed: 'Abu Dhabi, United Arab Emirates',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Abu Dhabi Chauffeur Service', href: '/chauffeur-service-abu-dhabi' },
  ],
  sections: {
    hero: {
      title: 'Luxury Chauffeur Service in Abu Dhabi',
      subtitle: 'Professional, Private, Premium',
      text: 'Experience first-class travel with our Abu Dhabi chauffeur service. Enjoy luxury vehicles, discreet professional drivers, and a smooth, comfortable journey.',
    },
    intro: {
      question: 'Does Emirates Limo provide chauffeur service in Abu Dhabi?',
      answer:
        'Yes. Emirates Limo runs private chauffeur-driven cars across Abu Dhabi, including the city centre, Al Reem, Yas Island, Saadiyat Island and Zayed International Airport, by the transfer or by the hour. Prices are fixed at booking, the service runs 24/7, and cancellations 24 hours or more before pickup are refunded in full.',
      paragraphs: [
        'Abu Dhabi spreads out more than Dubai, and the places visitors want to reach are far apart: the Corniche and the Louvre on Saadiyat, the Sheikh Zayed Grand Mosque near the airport road, Ferrari World and Yas Marina on Yas Island. A chauffeur by the hour turns that into one relaxed itinerary rather than four separate rides.',
        'Business travellers use the service for ADGM and the Al Maryah Island offices, government appointments, and the run to and from Dubai for meetings, which the Abu Dhabi to Dubai transfer page covers with the same fixed pricing.',
        'The same fleet serves both cities: sedans for up to four, the GMC Yukon for six, and the Kia Carnival or Mercedes-Benz V-Class for groups with luggage. Child seats are fitted on request.',
      ],
      facts: [
        { label: 'Coverage', value: 'Abu Dhabi city, Yas, Saadiyat, Al Reem, AUH airport' },
        { label: 'Booking types', value: 'Transfer, return, hourly, full day' },
        { label: 'Intercity', value: 'Abu Dhabi to Dubai and back, fixed price' },
        { label: 'Availability', value: '24/7' },
        { label: 'Cancellation', value: 'Full refund 24 hours or more before pickup' },
      ],
    },
    benefits: {
      title: 'Why Choose Our Abu Dhabi Chauffeur Service?',
      subtitle: 'Premium Chauffeur Experience',
      benefits: [
        {
          icon: LuCar,
          title: 'Luxury Chauffeur Fleet',
          text: 'Experience premium travel with our luxury Sedans, SUVs, and Vans, ideal for business travel, events, city journeys, and private chauffeur hire in Abu Dhabi.',
        },
        {
          icon: LuShieldCheck,
          title: 'Professional Chauffeurs',
          text: 'Our Abu Dhabi chauffeurs are highly trained, courteous, and experienced, ensuring complete comfort, privacy, and safety throughout your journey.',
        },
        {
          icon: LuClock,
          title: 'Punctual & Reliable Service',
          text: 'Enjoy on-time chauffeur service in Abu Dhabi with carefully planned routes and real-time monitoring so you never experience delays.',
        },
        {
          icon: LuCalendarX,
          title: 'Flexible & Hassle-Free Booking',
          text: 'Travel plans changed? No problem. Benefit from flexible scheduling and free cancellation up to 24 hours before pickup.',
        },
      ],
    },
    process: {
      title: 'Book Your Abu Dhabi Chauffeur in 4 Easy Steps',
      subtitle: 'Simple & Convenient',
    },
    services: {
      title: 'Premium Chauffeur & Limousine Service in Abu Dhabi',
      subtitle: 'Our Chauffeur Services',
    },
    fleet: {
      title: 'Luxury Vehicles For Chauffeur Hire',
      subtitle: 'Our Fleet',
    },
    related: {
      title: 'You May Also Need',
      subtitle: 'Related Services',
      links: getServiceLinks(['/abu-dhabi-airport-transfer', '/abu-dhabi-to-dubai-transfer', '/chauffeur-service']),
    },
    faqs: {
      title: 'Commonly Asked Questions',
      subtitle: 'FAQs',
      faqs: chauffeurFaqs.slice(0, 8),
    },
    testimonials: {
      title: 'Trusted Chauffeur Services in Abu Dhabi',
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
