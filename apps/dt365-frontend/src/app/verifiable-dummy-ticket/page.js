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
  HiCheckBadge,
  HiMagnifyingGlass,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiShieldCheck,
  HiXCircle,
} from 'react-icons/hi2';

const CANONICAL = `${SITE_URL}/verifiable-dummy-ticket`;

const QUESTION = 'What makes a dummy ticket verifiable?';
const ANSWER =
  'A verifiable dummy ticket carries a six-character PNR created on a global distribution system, which means Amadeus, Sabre or Travelport. Anyone with GDS access, including a consulate or an IATA accredited travel agent, can retrieve that record and see the passenger name, route and dates for as long as it stays live. A PDF with no live booking behind it is not verifiable, however convincing it looks.';

export const metadata = {
  title: 'Verifiable Dummy Ticket From USD 13 | Real GDS PNR',
  description:
    'A dummy ticket a consulate can actually look up: a live six-digit PNR on Amadeus, Sabre or Travelport, not a PDF mock-up. From USD 13, emailed in minutes.',
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true },
  openGraph: {
    url: CANONICAL,
    title: 'Verifiable Dummy Ticket From USD 13 | Real GDS PNR',
    description:
      'A live GDS reservation your consulate can retrieve and check, from USD 13.',
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
};

const benefits = [
  {
    title: 'A Record That Exists Outside the PDF',
    text: 'The PDF we email you is a receipt of something real. The reservation itself lives on the GDS, which is the same infrastructure airlines and travel agents book through, so it can be looked up independently of anything we send you.',
    icon: HiShieldCheck,
  },
  {
    title: 'Checkable by Anyone With GDS Access',
    text: 'Consulates, visa application centres and IATA accredited travel agents all have a way to pull a PNR. Give them the six characters and they see the passenger name, the route and the dates.',
    icon: HiMagnifyingGlass,
  },
  {
    title: 'Live for the Validity You Choose',
    text: 'Verification only works while the booking is live, so the tier you pick is the window in which it can be checked. Two days is USD 13, seven days is USD 19, fourteen days is USD 21.',
    icon: HiOutlineClock,
  },
  {
    title: 'What a Fake Looks Like',
    text: 'An edited screenshot, a PDF built from a template, or a PNR that returns nothing when queried. These fail the moment anyone checks, and a refused application is far more expensive than a real reservation.',
    icon: HiXCircle,
  },
  {
    title: 'Standard Airline Booking Format',
    text: 'The itinerary is laid out the way a real airline confirmation is laid out, with carrier codes, flight numbers and fare basis where applicable, so nothing about the document itself invites a second look.',
    icon: HiOutlineDocumentText,
  },
  {
    title: 'Issued, Not Generated',
    text: 'Every reservation is created through a GDS terminal against real inventory on real flights. That is what separates a reservation from a mock-up, and it is the whole reason the PNR resolves.',
    icon: HiCheckBadge,
  },
];

const faqs = [
  {
    question: QUESTION,
    answer: ANSWER,
  },
  {
    question: 'How do I check my dummy ticket is verifiable?',
    answer:
      'Ask any IATA accredited travel agent to retrieve the PNR, or use a GDS lookup tool. If the six characters return a booking with your name, your route and your dates, it is live. If they return nothing, it is not a reservation.',
  },
  {
    question: 'Why can I not find my reservation on the airline website?',
    answer:
      'Most airlines only expose ticketed bookings through their own Manage Booking page, so an unticketed GDS reservation often will not appear there even though it is perfectly live. Verification is done on the GDS, not on the carrier site. Emirates and Etihad are the usual exceptions, and their bookings can often be retrieved on the airline site as well.',
  },
  {
    question: 'Will a consulate know it is not a paid ticket?',
    answer:
      'Yes, and that is fine. A reservation is what most applications ask for. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a Schengen short stay visa rather than a purchased ticket, and consulates see reservations every day.',
  },
  {
    question: 'How long does the PNR stay verifiable?',
    answer:
      'For the validity you select: 2, 7 or 14 days from delivery. After that the booking lapses and the PNR stops resolving, so choose a tier that still covers the day someone is likely to check it.',
  },
  {
    question: 'Is a verifiable dummy ticket legal?',
    answer:
      'Yes. It is a genuine unticketed flight reservation, which is an ordinary product of the airline distribution system. What is not legitimate is a forged document presented as a booking, which is exactly what a live PNR distinguishes you from.',
  },
];


export default async function Page() {
  const usdPrices = await getUsdPrices();
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: 'Verifiable Dummy Ticket From USD 13',
      description: 'A live GDS reservation a consulate can retrieve and check.',
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Verifiable Dummy Ticket',
      description: 'Flight reservation with a live PNR on Amadeus, Sabre or Travelport.',
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Verifiable Dummy Ticket',
      description:
        'Unticketed flight reservation with a six-character PNR retrievable on global distribution systems.',
      price: String(usdPrices['2 Days']),
      currency: 'USD',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: 'How dummy ticket verification works.',
      faqs,
    }),
    buildBreadcrumbList({
      paths: [
        { label: 'Home', href: '/' },
        { label: 'Verifiable Dummy Ticket' },
      ],
    }),
  ]);
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Verifiable Dummy Ticket' },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Hero
        title="Verifiable Dummy Tickets From USD 13"
        subtitle="The word that matters here is verifiable. Our reservations are created on Amadeus, Sabre and Travelport and carry a real six-character PNR, so a consulate or a travel agent can pull the record up and confirm it rather than take the PDF on trust. Delivered by email within minutes."
        form={<AllForms forms={['ticket']} />}
        pills={[
          'Live GDS PNR, not a PDF mock-up',
          'Checkable by any IATA agent',
          'From USD 13',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={usdTiers(usdPrices)} />
      <Process
        title="How to Get a Verifiable Dummy Ticket"
        subtitle="Enter your route and dates, choose how long the booking needs to stay live, and pay. The PDF arrives by email with the PNR ready to quote."
      />
      <Benefits
        title="What Verifiable Actually Means"
        subtitle="The difference between a live reservation and a document that looks like one"
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
            anchor: 'Dummy ticket for a visa application',
            href: '/dummy-ticket-for-visa',
            blurb: 'What consulates ask for, and which visa types accept a reservation.',
          },
          {
            anchor: 'Dummy ticket valid for 14 days',
            href: '/dummy-ticket-14-days',
            blurb: 'The longest validity tier, for slower consulates.',
          },
          {
            anchor: 'Multi city dummy ticket',
            href: '/multi-city-dummy-ticket',
            blurb: 'Several legs under one PNR for multi-country trips.',
          },
          {
            anchor: 'Onward ticket for airline check-in',
            href: '/onward-ticket',
            blurb: 'Proof of onward travel in three validity tiers.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
