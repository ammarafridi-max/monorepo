import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { getPublishedBlogsApi } from '@travel-suite/frontend-shared/services/apiBlog';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v2/BlogPosts';
import { chauffeurFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';
import {
  buildFAQPage,
  buildGraph,
  buildMetadata,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import Hero from '@/components/HomeComponents/Hero';
import Services from '@/components/HomeComponents/Services';
import Process from '@/components/HomeComponents/Process';
import Fleet from '@/components/HomeComponents/Fleet';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';
import ServiceCta from '@/components/ServiceCta';

export const pageData = {
  meta: {
    title: 'Emirates Limo | Luxury Chauffeur & Transfers Dubai',
    description:
      'Emirates Limo offers premium chauffeur and airport transfer services across Dubai and the UAE. Book luxury rides with professional drivers today.',
    canonical: 'https://www.emirateslimo.com',
  },
  sections: {
    hero: {
      title: 'Book Your Dubai Chauffeur & Airport Transfer',
      subtitle: 'Luxury Chauffeur & Airport Transfers',
      text: 'Premium chauffeur services and airport transfers across Dubai and the UAE with professional drivers and luxury vehicles.',
    },
    services: { title: 'Premium Chauffeur Experiences in Dubai', subtitle: 'Our Services' },
    process: { title: 'Book Your Ride in 4 Easy Steps', subtitle: 'Our Process' },
    fleet: { title: 'Luxury Vehicles To Choose From', subtitle: 'Our Fleet' },
    benefits: {
      title: 'Why Book With Emirates Limo?',
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
    testimonials: {
      title: 'What Our Clients Say',
      subtitle: 'Client Testimonials',
      testimonials: chauffeurTestimonials,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'FAQs',
      faqs: chauffeurFaqs.slice(0, 8),
    },
    blog: { title: 'From Our Blog', subtitle: 'Travel tips, Dubai guides and chauffeur service insights' },
    cta: {
      title: 'Ready to Book Your Luxury Ride?',
      text: 'Experience premium chauffeur service and airport transfers across Dubai and the UAE.',
      primary: { href: '#booking-form', label: 'Book Now' },
      secondary: { href: '/contact-us', label: 'Contact Us' },
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default async function Page() {
  const { blogs = [] } = await getPublishedBlogsApi({ limit: 3 }).catch(() => ({ blogs: [] }));

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(pageData.meta),
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
      />
      <Services title={pageData.sections.services.title} subtitle={pageData.sections.services.subtitle} />
      <Process title={pageData.sections.process.title} subtitle={pageData.sections.process.subtitle} />
      <Fleet title={pageData.sections.fleet.title} subtitle={pageData.sections.fleet.subtitle} />
      <WhyBookEmiratesLimo
        title={pageData.sections.benefits.title}
        subtitle={pageData.sections.benefits.subtitle}
        benefits={pageData.sections.benefits.benefits}
      />
      <Testimonials
        title={pageData.sections.testimonials.title}
        subtitle={pageData.sections.testimonials.subtitle}
        testimonials={pageData.sections.testimonials.testimonials}
      />
      <FAQs
        title={pageData.sections.faqs.title}
        subtitle={pageData.sections.faqs.subtitle}
        faqs={pageData.sections.faqs.faqs}
      />
      {blogs.length > 0 && (
        <BlogPosts title={pageData.sections.blog.title} subtitle={pageData.sections.blog.subtitle} />
      )}
      <ServiceCta
        title={pageData.sections.cta.title}
        text={pageData.sections.cta.text}
        primary={pageData.sections.cta.primary}
        secondary={pageData.sections.cta.secondary}
      />
    </>
  );
}
