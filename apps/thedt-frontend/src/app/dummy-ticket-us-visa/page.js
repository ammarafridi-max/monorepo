import { EMAIL } from '@/config/contact';
import { faqArray, formatFaqArray } from '@/data/faqs';
import { testimonials } from '@/data/testimonials';
import { buildMetadata } from '@/lib/schema';
import {
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaFileAlt,
  FaHeadset,
  FaMoneyBillWave,
  FaShieldAlt,
} from 'react-icons/fa';
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import PricingTiers from '@/components/PricingTiers';
import BookCta from '@/components/BookCta';
import StickyBookingBar from '@travel-suite/frontend-shared/components/ui/v1/StickyBookingBar';
import { processSteps } from '@/data/processSteps';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';

const keyword = 'dummy ticket';

export const benefits = [
  {
    title: 'Verifiable PNRs',
    text: 'The reservation is genuine and the PNR is live, so a consular officer can pull it up in Amadeus, Sabre or Travelport. Some airlines show it under Manage Booking too, but plenty never display an unpaid hold, so the GDS lookup is the one to rely on.',
    icon: FaCheckCircle,
  },
  {
    title: 'Nothing for the officer to decode',
    text: 'Route, timings and traveller details set out plainly, the way a consular officer expects to see an itinerary. An interview is short and your paperwork should not slow it down.',
    icon: FaFileAlt,
  },
  {
    title: 'You are not betting on the outcome',
    text: 'US visa decisions are not guaranteed and long-haul fares are not cheap. A reservation gives you the document without asking you to gamble the airfare on a yes.',
    icon: FaShieldAlt,
  },
  {
    title: 'AED 49, from a Dubai agency',
    text: 'A licensed travel agency here in Dubai, issuing the reservation through the same channels as any other booking. The price starts at AED 49 and nothing about the document is second rate.',
    icon: FaMoneyBillWave,
  },
  {
    title: 'Minutes, not office hours',
    text: 'It lands in your inbox within 10 to 15 minutes of payment. If something needs changing or an officer queries it, the UAE based team replies around the clock.',
    icon: FaHeadset,
  },
  {
    title: 'Validity that fits your interview date',
    text: 'Two days at AED 49, seven at AED 69, fourteen at AED 79. US interview slots move around, so buy the window that still covers you if yours does.',
    icon: FaCalendarAlt,
  },
];

export const pageData = {
  meta: {
    title: 'Dummy Ticket for US Visa From AED 49 | Real PNR',
    description:
      'A genuine flight reservation with a live PNR for your B1/B2 interview. AED 49, emailed in minutes, and you can verify it before you submit anything.',
    canonical: 'https://www.thedummyticket.ae/dummy-ticket-us-visa',
    entityName: 'Dummy Ticket for US Visa',
    keywords: 'dummy ticket for us visa',
  },
  sections: {
    hero: {
      title: 'Show your travel plan without buying the flight.',
      subtitle:
        'A B1/B2 interview asks what you intend to do and when. A reservation under a live PNR answers the travel half of that without you paying a long-haul fare months before a decision. Verify it yourself in the systems consulates use. AED 49, delivered in minutes.',
      form: <AllForms />,
    },
    process: {
      title: 'How Do You Book a Dummy Ticket for a US Visa?',
      subtitle:
        'Fill in the trip, pick a validity window, pay, and watch your inbox',
      keyword,
    },
    about: {
      title: 'About Us',
      text: (
        <>
          A US visitor visa interview turns on your intentions: where you are going, for how long, and why you are coming back. The official{' '}<a href="https://www.ustraveldocs.com/ae/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-900">US visa information service for UAE applicants</a>{' '}sets out what a B1/B2 file needs. A reservation carrying a live PNR lets you put the travel part of that on paper without buying a fare you may not use.
        </>
      ),
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Dummy Tickets for US Visa',
          description:
            'A held seat with a real PNR, set out the way a B1/B2 file needs it. Made through airline systems and sent straight to your inbox.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Genuine AXA cover for UAE residents: emergency medical, cancellation and baggage. Not required for a US visa, but worth having before a long trip.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Where you are staying, prepared by email and formatted for a visa file. Send us the cities and dates.',
        },
      ],
    },
    benefits: {
      title: 'Why Book It Here for a US Visa?',
      subtitle:
        'Six things that matter when your interview is booked and the clock is running',
      benefits,
    },
    testimonials: {
      title: 'What Travellers Say',
      subtitle:
        'People who had an appointment to get to and a reservation to hand over',
      testimonials,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Validity, verification, and what happens if your date moves',
      faqs: formatFaqArray(faqArray, keyword),
    },
    blogs: {
      title: 'What Should You Read Next?',
      subtitle: 'Guides on visa paperwork, written by people who deal with it daily',
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
      areaServed: 'AE',
    }),
    buildProduct({
      canonical: pageData.meta.canonical,
      name: pageData.meta.entityName,
      description: pageData.meta.description,
      price: '49.00',
      currency: 'AED',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <Hero
        title={pageData.sections.hero.title}
        subtitle={pageData.sections.hero.subtitle}
        form={pageData.sections.hero.form}
        pills={[
          'Verifiable PNR Code',
          'US Embassy Accepted Format',
          'Delivered in Minutes',
          'Starts from AED 49',
        ]}
        breadcrumbPaths={[
          { label: 'Home', href: '/' },
          { label: 'Dummy Ticket for US Visa' },
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={processSteps}
      />

      <PricingTiers
        title="How Much Does a US Visa Dummy Ticket Cost?"
        keyword="US visa dummy ticket"
      />
      <About
        title={pageData.sections.about.title}
        text={pageData.sections.about.text}
        services={pageData.sections.about.services}
      />
      <Benefits
        title={pageData.sections.benefits.title}
        subtitle={pageData.sections.benefits.subtitle}
        benefits={pageData.sections.benefits.benefits}
      />
      <Testimonials
        title={pageData.sections.testimonials.title}
        subtitle={pageData.sections.testimonials.subtitle}
        testimonials={pageData.sections.testimonials.testimonials}
      />
      <FAQ
        title={pageData.sections.faqs.title}
        subtitle={pageData.sections.faqs.subtitle}
        faqs={pageData.sections.faqs.faqs}
      />
      <BookCta className="pb-16 md:pb-20 px-6" />
      <BlogPosts
        title={pageData.sections.blogs.title}
        subtitle={pageData.sections.blogs.subtitle}
      />
      <Contact email={EMAIL} replyTime="within 10 to 15 minutes, 24/7" />
      <StickyBookingBar label="Book now" />
    </>
  );
}
