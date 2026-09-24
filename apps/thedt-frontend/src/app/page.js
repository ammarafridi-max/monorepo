import { EMAIL } from '@/config/contact';
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
import {
  SITE_URL,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import { faqArray, formatFaqArray } from '@/data/faqs';
import { testimonials } from '@/data/testimonials';
import { Check, Clock, DollarSign } from 'lucide-react';
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';

const keyword = 'dummy ticket';

const benefits = [
  {
    title: 'Checks out at the counter',
    text: 'Every reservation is made in the airline systems consulates already query, so when VFS or BLS look up the PNR it is simply there.',
    icon: Check,
  },
  {
    title: 'In your inbox in minutes',
    text: 'Ten to fifteen minutes from payment, whatever the hour. Appointments get booked at odd times and so do we.',
    icon: Clock,
  },
  {
    title: 'AED 49, and that is the whole price',
    text: 'You pay for the validity window you pick. No surcharge for a return leg, no fee that appears at checkout.',
    icon: DollarSign,
  },
];

const pageData = {
  meta: {
    title: 'Dummy Ticket UAE From AED 49 | Live PNR You Can Check',
    description:
      'A real flight reservation with a PNR you can verify yourself, from AED 49 and emailed in 10 to 15 minutes. Built for visa files submitted from the UAE.',
    canonical: SITE_URL,
    entityName: 'Dummy Ticket',
  },
  sections: {
    hero: {
      title: 'A flight reservation your consulate can look up. From AED 49.',
      subtitle:
        'Not a paid ticket and not a mock-up. We hold a real seat under a live PNR, you check it yourself in the same systems embassies use, then attach it to your visa file. It reaches your inbox 10 to 15 minutes after payment, any hour of the day.',
    },
    process: {
      title: 'How Do You Book a Dummy Ticket?',
      subtitle:
        'Three steps, about two minutes of typing, and no phone call at any point',
    },
    about: {
      title: 'About Us',
      text: (
        <>
          No consulate expects you to buy a ticket before they have decided
          anything. What they ask for is evidence of how you intend to travel, and
          Article 14 of the{' '}
        <a
          href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32009R0810"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-900"
        >
          EU Visa Code
        </a>{' '}
          spells that out for Schengen applications. A reservation carrying a live
          PNR answers it in full, which is the whole reason this service exists.
        </>
      ),
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Dummy Tickets',
          description:
            'A held seat under a live PNR, made in the airline systems consulates already search. Use it for a visa file, for proof of onward travel, or for a border officer who wants to see how you are leaving.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Where you are staying, laid out the way a visa officer expects to read it. Email us the cities and dates and we put it together by hand, usually the same day.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Genuine AXA policies with the EUR 30,000 of medical cover Schengen consulates insist on. Issued the moment you pay, on its own or alongside a reservation.',
        },
      ],
    },
    benefits: {
      title: 'Why Book It Here?',
      subtitle:
        'Run out of Dubai, answering email at three in the morning because that is when appointments get confirmed',
      benefits,
    },
    testimonials: {
      title: 'What Do Our Customers Say?',
      subtitle:
        'People who had an appointment to get to and a reservation to hand over',
      testimonials,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle:
        'Validity, verification, delivery, and what happens if your appointment moves',
      faqs: formatFaqArray(faqArray, keyword),
    },
    blogs: {
      title: 'What Should You Read Next?',
      subtitle:
        'Guides on visa paperwork, written by people who deal with it daily',
    },
  },
};

export const metadata = {
  title: pageData.meta.title,
  description: pageData.meta.description,
  alternates: {
    canonical: pageData.meta.canonical,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: pageData.meta.canonical,
    title: pageData.meta.title,
    description: pageData.meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageData.meta.title,
    description: pageData.meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function HomePage() {
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: pageData.meta.canonical,
      title: pageData.meta.title,
      description: pageData.meta.description,
    }),
    buildService({
      canonical: pageData.meta.canonical,
      name: pageData.meta.entityName,
      description: pageData.meta.description,
      areaServed: 'AE',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'Frequently Asked Questions',
      description: pageData.meta.description,
      faqs: pageData.sections.faqs.faqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Hero
        title={pageData.sections.hero.title}
        subtitle={pageData.sections.hero.subtitle}
        form={<AllForms />}
        pills={[
          'Verify the PNR yourself',
          'Handled daily by VFS and BLS',
          'Emailed in 10 to 15 minutes',
          'From AED 49 per traveller',
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={processSteps}
      />

      <PricingTiers
        title="How Much Does a Dummy Ticket Cost?"
        keyword="dummy ticket"
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
