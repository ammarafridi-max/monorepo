import { EMAIL, WHATSAPP_NUMBER } from '@/config/contact';
import { testimonials } from '@/data/testimonials';
import QuickAnswer from '@/components/QuickAnswer';
import { getUsdPrices, usdTiers } from '@/lib/tiers';
import RelatedPages from '@/components/RelatedPages';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import {
  HiArrowsRightLeft,
  HiCheckBadge,
  HiGlobeAlt,
  HiMapPin,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
} from 'react-icons/hi2';

const CANONICAL = `${SITE_URL}/multi-city-dummy-ticket`;

const QUESTION = 'Can a dummy ticket cover a multi city trip?';
const ANSWER =
  'Yes. A multi city dummy ticket is a single reservation covering several flights in sequence, which is what a Schengen application needs when you enter through one country and leave from another. Every leg sits under the same six-character PNR on Amadeus, Sabre or Travelport, so a consulate checking the booking sees the whole route rather than a disconnected set of bookings.';

export const metadata = {
  title: 'Multi City Dummy Ticket From USD 13 | One PNR, All Legs',
  description:
    'A multi city flight reservation for visa applications. Every leg under one verifiable PNR on Amadeus, Sabre or Travelport. From USD 13, emailed in minutes.',
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true },
  openGraph: {
    url: CANONICAL,
    title: 'Multi City Dummy Ticket From USD 13 | One PNR, All Legs',
    description:
      'Several flights in sequence under a single verifiable PNR, from USD 13.',
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
};

const benefits = [
  {
    title: 'Every Leg Under One PNR',
    text: 'A consulate pulling your booking sees the full itinerary in one record: each flight, in order, with dates and carriers. That reads as a coherent travel plan, which is precisely what the application is asking you to demonstrate.',
    icon: HiShieldCheck,
  },
  {
    title: 'Built for the Schengen Entry Rule',
    text: 'A Schengen file is assessed by the country you spend the most nights in, or the first one you enter. A multi city itinerary makes that obvious on the page instead of leaving an officer to work it out from separate bookings.',
    icon: HiMapPin,
  },
  {
    title: 'Open Jaw and Open Return Routings',
    text: 'Flying into Rome and out of Paris, or looping through three countries before heading home, is a normal GDS routing. We build it the way an airline would rather than stapling one way reservations together.',
    icon: HiArrowsRightLeft,
  },
  {
    title: 'Real Carriers, Real Connections',
    text: 'Legs use genuine airlines on routes those airlines actually fly, with connection times that make sense. An itinerary with an impossible transfer is the kind of detail that invites questions.',
    icon: HiGlobeAlt,
  },
  {
    title: 'Priced Per Person, Not Per Leg',
    text: 'A multi city reservation costs the same as any other tier: USD 13 for 2 days validity, USD 19 for 7 days, USD 21 for 14 days. Adding legs does not add to the price.',
    icon: HiOutlineCurrencyDollar,
  },
  {
    title: 'Nothing Bought Before Approval',
    text: 'Paid multi city fares are the expensive kind, and they are the hardest to change if a consulate takes longer than expected. A reservation meets the documentary requirement without committing to any of it.',
    icon: HiCheckBadge,
  },
];

const faqs = [
  { question: QUESTION, answer: ANSWER },
  {
    question: 'How many flights can a multi city dummy ticket include?',
    answer:
      'Enough for a realistic trip. Most multi city files we issue run to three or four legs, which covers the usual entry, internal hop and departure pattern. Tell us the route and we will build it as one reservation.',
  },
  {
    question: 'Is a multi city reservation better for a Schengen visa?',
    answer:
      'It is better when your trip genuinely is multi city, because the itinerary then matches the travel plan you describe in the rest of your application. If you are flying in and out of the same airport, a simple return reservation is the honest document and the right one.',
  },
  {
    question: 'Does it cost more than a one way or return ticket?',
    answer:
      'No. Pricing is by validity tier and per passenger, not by the number of legs. A four leg itinerary on the 2 day tier is still USD 13 per person.',
  },
  {
    question: 'Can I include internal flights between Schengen countries?',
    answer:
      'Yes, and it often makes the plan more credible. Internal European legs sit in the same PNR as the long haul ones, so the whole sequence is visible in a single lookup.',
  },
  {
    question: 'What if my plans change after I get the reservation?',
    answer:
      'Nothing is paid, so nothing is lost. The booking simply lapses at the end of its validity. If you need a different routing before then, order the corrected itinerary rather than trying to amend the old record.',
  },
  {
    question: 'Will all the legs be verifiable?',
    answer:
      'Yes. One PNR covers the itinerary, so retrieving it returns every leg. Most airlines only show ticketed bookings on their own websites, so verification is done on the GDS, where the full record lives.',
  },
];


export default async function Page() {
  const usdPrices = await getUsdPrices();
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: 'Multi City Dummy Ticket',
      description: 'Several flights in sequence under a single verifiable PNR.',
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Multi City Dummy Ticket',
      description: 'Multi leg flight reservation issued as one GDS record.',
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Multi City Dummy Ticket',
      description:
        'Multi leg unticketed flight reservation with every leg under one verifiable PNR.',
      price: String(usdPrices['2 Days']),
      currency: 'USD',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: 'How multi city dummy tickets work.',
      faqs,
    }),
    buildBreadcrumbList({
      paths: [
        { label: 'Home', href: '/' },
        { label: 'Multi City Dummy Ticket' },
      ],
    }),
  ]);
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Multi City Dummy Ticket' },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Hero
        title="Multi City Dummy Tickets From USD 13"
        subtitle="Flying into one country and out of another is the normal shape of a European trip, and it is the shape most visa files have to describe. A multi city reservation puts every leg under one PNR on Amadeus, Sabre or Travelport, so the whole route shows up in a single lookup. Delivered by email in minutes."
        form={<AllForms forms={['ticket']} />}
        pills={[
          'All legs under one PNR',
          'Open jaw routings supported',
          'From USD 13 per person',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={usdTiers(usdPrices)} />
      <Process
        title="How to Book a Multi City Dummy Ticket"
        subtitle="Give us the legs in the order you plan to fly them, choose a validity that covers your appointment window, and pay. The itinerary arrives by email."
      />
      <Benefits
        title="Why a Single Multi City Reservation"
        subtitle="What one PNR across several legs gets you that separate bookings do not"
        benefits={benefits}
      />
      <Testimonials
        title="Testimonials"
        subtitle="What travellers say about our dummy ticket service"
        testimonials={testimonials}
      />
      <FAQ title="Frequently Asked Questions" subtitle="Common questions answered" faqs={faqs} />
      <BlogPosts title="Blog Posts" subtitle="Recently published blog posts" />
      <RelatedPages
        title="Related Dummy Ticket Pages"
        subtitle="Other options and use cases"
        links={[
          {
            anchor: 'Dummy ticket for a Schengen visa',
            href: '/dummy-ticket-schengen-visa',
            blurb: 'EU Visa Code Article 14 compliant, accepted at VFS, BLS and TLScontact.',
          },
          {
            anchor: 'Verifiable dummy ticket',
            href: '/verifiable-dummy-ticket',
            blurb: 'How a consulate checks a PNR, and what a fake fails on.',
          },
          {
            anchor: 'Dummy ticket valid for 14 days',
            href: '/dummy-ticket-14-days',
            blurb: 'The longest validity tier, for slower consulates.',
          },
          {
            anchor: 'Dummy ticket for a visa application',
            href: '/dummy-ticket-for-visa',
            blurb: 'What consulates ask for, by visa type.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
