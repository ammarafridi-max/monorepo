import { EMAIL } from '@/config/contact';
import { faqArray, formatFaqArray } from '@/data/faqs';
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
  HiCheck,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';
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
import { testimonials, formatTestimonialsArray } from '@/data/testimonials';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';

const keyword = 'onward ticket';

export const benefits = [
  {
    title: 'Holds up at the desk',
    text: 'The reservation sits in the airline system under a live PNR, which is what a check-in agent or a border officer is actually looking for when they ask how you are leaving.',
    icon: HiCheck,
  },
  {
    title: 'Ready before your taxi is',
    text: 'Ten to fifteen minutes from payment, round the clock. Useful when you find out at the airport that you needed one.',
    icon: HiOutlineClock,
  },
  {
    title: 'AED 49 instead of a fare',
    text: 'A throwaway flight costs hundreds of dirhams and refunds are a coin toss. This costs AED 49 and you lose nothing if your plans shift.',
    icon: HiOutlineCurrencyDollar,
  },
  {
    title: 'Stays live for days, not hours',
    text: 'Seven or fourteen days from issue, well past the usual airline hold. Long enough to clear immigration or sit in a processing queue.',
    icon: HiOutlineClock,
  },
  {
    title: 'Reads like an itinerary should',
    text: 'Passenger name, route, dates and PNR where an officer expects to find them, so nobody has to hunt around your screen.',
    icon: HiCheck,
  },
  {
    title: 'Someone answers',
    text: 'Date change, confirmation letter, an odd entry rule for one country. Email us and a reply lands in 10 to 15 minutes, whatever time it is.',
    icon: HiCheck,
  },
];

export const pageData = {
  meta: {
    title: 'Onward Ticket From AED 49 | Live PNR for Check-In',
    description:
      'Proof you are leaving, held under a real PNR that airlines and immigration can verify. AED 49, emailed in 10 to 15 minutes, no fare to write off.',
    canonical: 'https://www.thedummyticket.ae/onward-ticket',
    entityName: 'Onward Ticket',
  },
  sections: {
    hero: {
      title: 'Proof you are leaving, without buying a flight you will not take.',
      subtitle:
        'Some countries will not let you in until you show how you are getting out, and some airlines will not board you without it. An onward ticket is a genuine reservation under a live PNR that answers the question at check-in and at the border. AED 49, in your inbox within minutes.',
      form: <AllForms />,
    },
    process: {
      title: 'How Do You Book an Onward Ticket?',
      subtitle: 'Two minutes of typing, then wait for the email',
      keyword,
    },
    about: {
      title: 'About Us',
      text: (
        <>
          We have been issuing flight reservations since 2008, long enough to have seen every version of this go wrong. Airlines check onward travel at the desk against{' '}<a href="https://www.iata.org/en/publications/timatic/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-900">IATA's Timatic database</a>, so what counts is that the booking genuinely exists in the system. A live PNR does. A printed PDF does not.
        </>
      ),
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Onward Tickets',
          description:
            'A held seat under a live PNR that a check-in agent or border officer can verify. Sent within minutes and live long enough to get you through the checks.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Genuine AXA cover for UAE residents: medical emergencies, cancellation and baggage. Sensible company for a one-way trip into a country you do not know yet.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Border officers sometimes ask where you are staying, not just how you are leaving. Email us the dates and we prepare it.',
        },
      ],
    },
    benefits: {
      title: 'Why Book It Here?',
      subtitle: 'Dubai based, awake at the hours people actually need this',
      benefits,
    },
    testimonials: {
      title: 'What Do Our Customers Say?',
      subtitle: 'People who needed one before a flight or an appointment',
      testimonials: formatTestimonialsArray(testimonials, keyword),
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'What it is, who asks for it, and how long it lasts',
      faqs: [
        {
          question: 'What is an onward ticket?',
          answer:
            'It is a confirmed reservation for a flight out of the country you are entering. Immigration officers use it to confirm you are not planning to overstay, and airlines check it before boarding because they carry the cost of flying you back if you are refused entry.',
        },
        {
          question: 'Which countries require an onward ticket?',
          answer:
            'Thailand, Vietnam, Indonesia, the Philippines, Costa Rica and Peru are the ones travellers get caught by most often, but the list moves. The airline can also ask independently of the country, so check both before you fly.',
        },
        {
          question:
            'What is the difference between an onward ticket and a dummy ticket?',
          answer:
            'Same kind of document, different audience. A dummy ticket goes into a visa file to show a consulate where you intend to go. An onward ticket is shown at an airport to prove you are leaving again. Both are genuine reservations with a live PNR.',
        },
        {
          question: 'How long is the onward ticket valid for?',
          answer:
            'Seven or fourteen days from issue, whichever you pick at checkout. Time it so the reservation is still live on the day you fly, not the day you booked it.',
        },
        {
          question: 'Do you offer refunds if I no longer need the ticket?',
          answer:
            'One case, clearly: if a refusal letter says the reservation had expired or could not be verified, send it over and we refund in full. Changed plans or a refusal on other grounds is not covered. If your date moves, we reissue with new dates for free.',
        },
      ],
    },
    blogs: {
      title: 'What Should You Read Next?',
      subtitle: 'Guides on entry rules and visa paperwork',
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
          'Accepted by Immigration Worldwide',
          'Real PNR Included',
          'Delivered in Minutes',
          'Starts from AED 49',
        ]}
        breadcrumbPaths={[
          { label: 'Home', href: '/' },
          { label: 'Onward Ticket' },
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={processSteps}
      />

      <PricingTiers
        title="How Much Does an Onward Ticket Cost?"
        keyword="onward ticket"
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
