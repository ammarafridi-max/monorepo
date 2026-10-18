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
  HiBanknotes,
  HiCheckBadge,
  HiDocumentCheck,
  HiOutlineClock,
  HiScale,
  HiShieldCheck,
} from 'react-icons/hi2';

const CANONICAL = `${SITE_URL}/dummy-ticket-for-visa`;

const QUESTION = 'Is a dummy ticket accepted for a visa application?';
const ANSWER =
  'Yes, for most visa types. Consulates ask for evidence of your travel plan, not proof of purchase, and a flight reservation with a verifiable PNR satisfies that. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a Schengen short stay visa rather than a paid ticket. Buying a refundable fare before a decision ties up money you may wait weeks to see again.';

export const metadata = {
  title: 'Dummy Ticket for Visa Applications From USD 13 | By Type',
  description:
    'Which visa applications accept a flight reservation instead of a paid ticket, and what the document has to show. Verifiable PNR from USD 13, emailed in minutes.',
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true },
  openGraph: {
    url: CANONICAL,
    title: 'Dummy Ticket for Visa Applications From USD 13 | By Type',
    description:
      'What consulates ask for, by visa type, and the reservation that satisfies it. From USD 13.',
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
};

const benefits = [
  {
    title: 'A Reservation Is the Requirement, Not a Ticket',
    text: 'Most application checklists say flight reservation, itinerary or proof of travel plan. They rarely say purchased ticket. Reading the checklist literally is usually the cheapest thing an applicant can do.',
    icon: HiDocumentCheck,
  },
  {
    title: 'Verifiable PNR on Global GDS',
    text: 'Every reservation carries a six-character PNR created on Amadeus, Sabre or Travelport, the same systems consulates and IATA accredited travel agents use to confirm a booking while it is live.',
    icon: HiShieldCheck,
  },
  {
    title: 'The Money Stays Where It Is',
    text: 'A refundable long haul fare runs into hundreds and the refund lands long after you needed it. A reservation answers the same documentary requirement for the price of a meal.',
    icon: HiBanknotes,
  },
  {
    title: 'Validity You Pick to Match the Queue',
    text: 'Two days for a counter check, seven for a typical visa centre, fourteen when the consulate is slow. The PNR has to be live on the day someone opens your file, which is the only date that matters.',
    icon: HiOutlineClock,
  },
  {
    title: 'Honest About the Exceptions',
    text: 'A few visa routes do ask for a confirmed ticket, usually for employment or long stay categories rather than visitor visas. If your checklist says purchased, buy the ticket. We would rather say so than sell you the wrong document.',
    icon: HiScale,
  },
  {
    title: 'Not Only for Visas',
    text: 'The same reservation works as proof of onward travel at airline check-in and at immigration counters, which is why plenty of customers who need one are not applying for a visa at all.',
    icon: HiCheckBadge,
  },
];

const faqs = [
  { question: QUESTION, answer: ANSWER },
  {
    question: 'Does it matter if the checklist says dummy flight ticket or flight itinerary?',
    answer:
      'No. Dummy ticket, dummy flight ticket, dummy air ticket and flight itinerary all point at the same thing: an unticketed reservation with a retrievable PNR. Match whatever wording the mission uses in your covering letter and submit the same document.',
  },
  {
    question: 'Which visa types accept a flight reservation?',
    answer:
      'Short stay visitor and tourist categories almost always do, including Schengen, UK Standard Visitor, Canadian visitor, Japanese tourist and Australian visitor applications. Long stay, work and settlement routes vary, so read the specific checklist for the route you are on.',
  },
  {
    question: 'Is a dummy ticket legal?',
    answer:
      'Yes. It is a genuine unticketed flight reservation, an ordinary product of airline distribution systems. What is not legitimate is a forged document presented as a booking, which is exactly what a live retrievable PNR distinguishes you from.',
  },
  {
    question: 'Will the consulate reject my application for not buying a ticket?',
    answer:
      'Not where a reservation is what the checklist asks for. Refusals cited to flights are usually about an itinerary that contradicts the rest of the file, such as dates that do not match the stated trip, rather than about the booking being unticketed.',
  },
  {
    question: 'What should the reservation show?',
    answer:
      'Your name exactly as it appears in your passport, the route, the dates that match the trip you describe elsewhere in the application, and a PNR that resolves. Mismatched name spelling is the single most common avoidable problem.',
  },
  {
    question: 'How soon before my appointment should I order it?',
    answer:
      'Close enough that the validity still covers the appointment. Ordering a fortnight early on the 2 day tier means a lapsed booking by the time anyone checks. You can also schedule delivery for a later date and start the clock then.',
  },
  {
    question: 'Can I pay in my own currency?',
    answer:
      'Yes, in several. Prices are set per currency rather than converted at checkout, so the amount you see is the amount charged. There are rupee, dirham, pound, Canadian dollar and riyal price books alongside the US dollar one.',
  },
];


export default async function Page() {
  const usdPrices = await getUsdPrices();
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: 'Dummy Ticket for Visa Applications',
      description: 'Which visa applications accept a flight reservation instead of a paid ticket.',
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Visa Applications',
      description: 'Verifiable flight reservations for visa supporting documents.',
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Visa Applications',
      description:
        'Unticketed flight reservation with a verifiable PNR, accepted as a visa supporting document.',
      price: String(usdPrices['2 Days']),
      currency: 'USD',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: 'Dummy tickets and visa applications.',
      faqs,
    }),
    buildBreadcrumbList({
      paths: [
        { label: 'Home', href: '/' },
        { label: 'Dummy Ticket for Visa Applications' },
      ],
    }),
  ]);
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Dummy Ticket for Visa Applications' },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Hero
        title="Dummy Tickets for Visa Applications From USD 13"
        subtitle="Almost every visitor visa checklist asks for a flight reservation rather than a purchased ticket, and a reservation with a verifiable PNR is what satisfies it. Ours are issued on Amadeus, Sabre and Travelport in three validity tiers and delivered by email within minutes. Pick your visa type below for what that specific application expects."
        form={<AllForms forms={['ticket']} />}
        pills={[
          'Reservation, not a paid ticket',
          'Verifiable GDS PNR',
          'From USD 13',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={usdTiers(usdPrices)} />
      <Process
        title="How to Get a Dummy Ticket for Your Visa"
        subtitle="Enter your route and the dates in your application, pick a validity that covers the appointment, and pay. The PDF arrives by email."
      />
      <Benefits
        title="What Consulates Actually Require"
        subtitle="Reading the checklist literally is usually the cheapest move an applicant can make"
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
        title="Dummy Tickets by Visa Type"
        subtitle="What each application expects, and the reservation that satisfies it"
        links={[
          {
            anchor: 'Dummy ticket for a Schengen visa',
            href: '/dummy-ticket-schengen-visa',
            blurb: 'EU Visa Code Article 14 compliant, accepted at VFS, BLS and TLScontact.',
          },
          {
            anchor: 'Dummy ticket for a UK visa',
            href: '/dummy-ticket-uk-visa',
            blurb: 'Standard Visitor visa file ready, no paid ticket needed before approval.',
          },
          {
            anchor: 'Dummy ticket for a Canada visa',
            href: '/dummy-ticket-canada-visa',
            blurb: 'Aligned with IRCC guidance on flight bookings before approval.',
          },
          {
            anchor: 'Dummy ticket for a Japan visa',
            href: '/dummy-ticket-japan-visa',
            blurb: 'Itinerary formatted for the documents a Japan application asks for.',
          },
          {
            anchor: 'Dummy ticket for an Australia visa',
            href: '/dummy-ticket-australia-visa',
            blurb: 'Formatted for the Subclass 600 ImmiAccount upload.',
          },
          {
            anchor: 'Multi city dummy ticket',
            href: '/multi-city-dummy-ticket',
            blurb: 'Several legs under one PNR when you enter and leave by different countries.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
