import { EMAIL } from '@/config/contact';
import { testimonials } from '@/data/testimonials';
import { buildMetadata } from '@/lib/schema';
import {
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
} from 'react-icons/hi2';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import BookCta from '@/components/BookCta';
import StickyBookingBar from '@travel-suite/frontend-shared/components/ui/v1/StickyBookingBar';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';

const keyword = 'flight reservation';

export const benefits = [
  {
    title: 'The format everyone recognises',
    text: 'A real itinerary with a live PNR, set out the way airlines issue them, so whoever you hand it to already knows how to read it.',
    icon: HiCheck,
  },
  {
    title: 'In your inbox in minutes',
    text: 'Ten to fifteen minutes from payment, at any hour. Nothing here waits for an office to open.',
    icon: HiOutlineClock,
  },
  {
    title: 'AED 49',
    text: 'That is the whole price for a prepared itinerary with the booking details laid out properly. No extra for a return leg.',
    icon: HiOutlineCurrencyDollar,
  },
];

export const pageData = {
  meta: {
    title: 'Flight Itinerary From AED 49 | Instant Delivery With PNR',
    description:
      'A real flight itinerary under a live PNR, issued in standard airline format and emailed within minutes. From AED 49.',
    canonical: 'https://www.thedummyticket.ae/flight-itinerary',
    entityName: 'Flight Itinerary',
  },
  sections: {
    hero: {
      title: 'A flight itinerary you can hand over with confidence.',
      subtitle:
        'Booking reference, route, times and passenger details in the format airlines issue and everyone else expects. Held under a live PNR, so it holds up when someone checks. From AED 49, emailed within minutes.',
      form: <AllForms />,
    },
    process: {
      title: 'How To Get Your Flight Itinerary?',
      subtitle: 'Three steps, about two minutes of typing',
      keyword,
    },
    benefits: {
      title: 'Why Book It Here?',
      subtitle: 'Quick to arrive, correct in the details, easy to verify',
      benefits,
    },
    testimonials: {
      title: 'What Travellers Say',
      subtitle: 'People who needed one before an appointment or a flight',
      testimonials,
    },
    contact: {
      title: 'Questions Before You Book?',
      text: 'Email us the route and the date you need it live, and we will tell you which option fits. Replies land within 10 to 15 minutes, day or night.',
    },
  },
};

// Kept live for Google Ads landing traffic, but excluded from search: the page
// is thin and duplicates what the dummy ticket pages already cover.
export const metadata = {
  ...buildMetadata(pageData.meta),
  robots: { index: false, follow: true },
};

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
          'Official Airline Format',
          'Real PNR Included',
          'Delivered in Minutes',
          'Starts from AED 49',
        ]}
        breadcrumbPaths={[
          { label: 'Home', href: '/' },
          { label: 'Flight Itinerary' },
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
      />
      <Benefits
        title={pageData.sections.benefits.title}
        subtitle={pageData.sections.benefits.subtitle}
        benefits={pageData.sections.benefits.benefits}
      />
      <BookCta className="pb-16 md:pb-20 px-6" />
      <Contact
        email={EMAIL}
        replyTime="within 10 to 15 minutes, 24/7"
        title={pageData.sections.contact.title}
        text={pageData.sections.contact.text}
      />
      <StickyBookingBar label="Book now" />
    </>
  );
}
