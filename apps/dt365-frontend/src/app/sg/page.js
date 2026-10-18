import { EMAIL, WHATSAPP_NUMBER } from '@/config/contact';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';
import QuickAnswer from '@/components/QuickAnswer';
import RelatedPages from '@/components/RelatedPages';
import { testimonials } from '@/data/testimonials';
import { getDummyTicketPricingServerApi } from '@travel-suite/frontend-shared/services/apiPricing';
import { tiersFrom } from '@/lib/tiers';
import {
  SITE_URL,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import {
  HiArrowsRightLeft,
  HiBolt,
  HiGlobeAlt,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
  HiUsers,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety } from 'react-icons/md';

const CANONICAL = `${SITE_URL}/sg`;
const FALLBACK = { '2 Days': 17, '7 Days': 25, '14 Days': 27 };

export const revalidate = 300;

async function getSgdPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('SGD');
    if (data?.currency !== 'SGD' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const sgd = (n) => `SGD ${Number(n).toLocaleString('en-SG')}`;

const QUESTION = 'Why would you need a dummy ticket in Singapore?';
const ANSWER =
  'Usually for onward travel rather than a visa. A Singapore passport opens most borders without one, so the document is needed at the check-in desk when you fly one way, or for the few countries that still require a visa. Residents here on an Employment Pass or S Pass often need it for a passport that is not Singaporean.';

export async function generateMetadata() {
  const p = await getSgdPrices();
  return {
    title: `Dummy Ticket Singapore from ${sgd(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in Singapore with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in Singapore dollars from ${sgd(p['2 Days'])}, emailed in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket Singapore from ${sgd(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for Singapore, priced in Singapore dollars from ${sgd(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getSgdPrices();
  const from = sgd(p['2 Days']);

  const benefits = [
    {
      title: 'Singapore Dollars at Checkout',
      text: `The page says ${from} and that is what leaves your account. Nothing is quoted in US dollars and converted, so a local card picks up no cross-border fee on the way through.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'The Changi One-Way Problem',
      text: 'Fly out of Changi on a one-way booking and the agent will ask how you are leaving the other end. A live reservation answers that in a few seconds without you buying a return you do not want.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'For Passholders on Another Passport',
      text: 'Plenty of people living here hold an Employment Pass or S Pass on an Indian, Filipino, Indonesian or Chinese passport, and those passports need visas that a Singaporean one does not.',
      icon: HiUsers,
    },
    {
      title: 'A PNR That Resolves',
      text: 'Each booking sits on Amadeus, Sabre or Travelport with a six-character record anyone with GDS access can retrieve, showing the passenger name, the route and the dates.',
      icon: HiShieldCheck,
    },
    {
      title: 'Regional Hops and Long Hauls Alike',
      text: 'Short runs to Bangkok, Jakarta or Kuala Lumpur and long hauls to Europe or North America are built the same way, on carriers that genuinely fly those routes from SIN.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Minutes, Not Office Hours',
      text: 'The reservation is issued automatically, so it arrives whether you are sorting this out over lunch or at two in the morning before an early flight.',
      icon: HiBolt,
    },
  ];

  const faqs = [
    { question: QUESTION, answer: ANSWER },
    {
      question: 'How much does a dummy ticket cost in Singapore?',
      answer: `It costs ${sgd(p['2 Days'])} for 2 days validity, ${sgd(p['7 Days'])} for 7 days or ${sgd(p['14 Days'])} for 14 days. Those are Singapore dollar prices charged in Singapore dollars, with no conversion applied between the page and your statement.`,
    },
    {
      question: 'Will Changi check-in staff accept it?',
      answer: 'The agent is looking for evidence that you leave the destination within your permitted stay, and a live reservation with a retrievable PNR shows exactly that. Some airlines word the request as a dummy flight ticket or a dummy air ticket; it is the same document.',
    },
    {
      question: 'I hold a Singapore PR but not a Singapore passport. Which rules apply?',
      answer: 'Your passport decides, not your residency. PR status helps you re-enter Singapore but the destination country looks at the document you are travelling on, so check that passport requirements rather than Singapore ones.',
    },
    {
      question: 'Is it useful for a China or India visa from Singapore?',
      answer: 'Yes. Both ask for evidence of intended travel and accept a reservation rather than a paid ticket. Keep the dates consistent with the rest of the application, because mismatched dates cause more trouble than the booking type ever does.',
    },
    {
      question: 'How long should the booking stay live?',
      answer: 'Match it to when someone will look. Two days is enough for a check-in desk, seven covers a typical visa centre, and fourteen is for a mission that takes its time before opening your file.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket Singapore from ${from}`,
      description: `Verifiable flight reservations for Singapore, priced in Singapore dollars from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Singapore',
      description: `Verifiable flight reservations priced in Singapore dollars from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Singapore',
      description: `Unticketed flight reservation with a verifiable PNR, priced in Singapore dollars from ${from}.`,
      price: String(p['2 Days']),
      currency: 'SGD',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for travellers in Singapore from ${from}.`,
      faqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Hero
        title={`Dummy Tickets in Singapore from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR on Amadeus, Sabre or Travelport. From Singapore it is mostly a check-in document, proving onward travel when you fly one way, and a visa document for passports that still need one. Priced and charged in Singapore dollars from ${from}.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in SGD`,
          'Valid 6-digit PNR',
          'Accepted at check-in',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={tiersFrom(p, sgd)} />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and dates, choose how long the booking stays live, and pay in Singapore dollars. The PDF arrives by email."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide, Singapore included. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by airline staff and consulates. Priced in Singapore dollars from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Arranged on request, so email your trip details to ${EMAIL}.`,
          },
        ]}
      />
      <Benefits
        title="Why Travellers in Singapore Book With Dummy Ticket 365"
        subtitle="Local pricing, a record that resolves, and no waiting on an office to open"
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
        title="Popular Dummy Ticket Pages"
        subtitle="Other options and use cases"
        links={[
          {
            anchor: 'Onward ticket for airline check-in',
            href: '/onward-ticket',
            blurb: 'Proof of onward travel in three validity tiers.',
          },
          {
            anchor: 'Verifiable dummy ticket',
            href: '/verifiable-dummy-ticket',
            blurb: 'How an agent retrieves the record, and what a generated PDF fails on.',
          },
          {
            anchor: 'Multi city dummy ticket',
            href: '/multi-city-dummy-ticket',
            blurb: 'Several legs under one PNR for a regional loop.',
          },
          {
            anchor: 'Dummy ticket for a Schengen visa',
            href: '/dummy-ticket-schengen-visa',
            blurb: 'EU Visa Code Article 14 compliant, accepted at VFS, BLS and TLScontact.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
