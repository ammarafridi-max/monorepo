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
  HiCheckBadge,
  HiGlobeAlt,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety } from 'react-icons/md';

const CANONICAL = `${SITE_URL}/sa`;
const FALLBACK = { '2 Days': 49, '7 Days': 69, '14 Days': 79 };

export const revalidate = 300;

async function getSarPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('SAR');
    if (data?.currency !== 'SAR' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const sar = (n) => `SAR ${Number(n).toLocaleString('en-SA')}`;

export async function generateMetadata() {
  const p = await getSarPrices();
  return {
    title: `Dummy Ticket Saudi Arabia from ${sar(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in Saudi Arabia with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in riyals from ${sar(p['2 Days'])}, delivered by email in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket Saudi Arabia from ${sar(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for residents of Saudi Arabia, priced in riyals from ${sar(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getSarPrices();
  const from = sar(p['2 Days']);

  const benefits = [
    {
      title: 'Riyals Billed as Riyals',
      text: `The dummy ticket is ${from} and your card is charged ${from}. Nothing is priced in dollars and converted, so a Saudi-issued card picks up no foreign currency markup.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'The Iqama Does Not Travel With You',
      text: 'Your residence permit governs life in the Kingdom. The mission you are applying to looks at your passport, and an Indian, Pakistani, Bangladeshi, Egyptian or Sudanese one needs visas on its own terms.',
      icon: HiCheckBadge,
    },
    {
      title: 'Routes That Leave From Here',
      text: 'Itineraries depart RUH, JED, DMM and MED on carriers that genuinely serve those routes, including the Gulf, Levant and South Asian connections most people in the Kingdom actually connect through.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'Around Umrah the Queues Get Longer',
      text: 'Visa centres in Riyadh, Jeddah and Al Khobar slow down in the busy seasons, and a file sitting for ten days needs a booking that is still live when someone finally opens it.',
      icon: HiShieldCheck,
    },
    {
      title: 'Dummy Air Ticket, Flight Reservation, Same Record',
      text: 'The wording varies between agents and consulates. Dummy ticket, dummy air ticket, dummy flight ticket and flight reservation all mean a booking with a PNR that resolves when checked.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Issued Outside Office Hours',
      text: 'Bookings are generated automatically, so a file being finished after Isha on a Thursday does not wait for an agency to reopen on Sunday morning.',
      icon: HiOutlineClock,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in Saudi Arabia?',
      answer: `A dummy ticket costs ${sar(p['2 Days'])} for 2 days validity, ${sar(p['7 Days'])} for 7 days, or ${sar(p['14 Days'])} for 14 days. Those are riyal amounts billed exactly as shown, not a dollar price converted at your bank's rate.`,
    },
    {
      question: 'Is a dummy air ticket different from a dummy ticket?',
      answer: 'No, they are the same. Dummy ticket, dummy air ticket and dummy flight ticket all describe an unticketed reservation held on a global distribution system with a verifiable PNR, whatever your agent or the consulate calls it.',
    },
    {
      question: 'Which centres in the Kingdom handle these applications?',
      answer: 'European, British, American and Canadian applications are submitted through visa centres in Riyadh, Jeddah and Al Khobar, and those checklists ask for a flight reservation rather than a purchased ticket.',
    },
    {
      question: 'Does my nationality change what I need?',
      answer: 'It decides everything except the reservation itself. Your passport determines which visa you need and what else goes in the file, while the flight booking requirement and the way it is verified stay the same.',
    },
    {
      question: 'Does the busy season change how early I should order?',
      answer: 'It changes the validity more than the timing. When the centres are slow, a file can sit for a week and a half, so the fourteen day tier is the one that is still live when somebody finally opens it.',
    },
    {
      question: 'How long should I make the booking valid?',
      answer: 'Match it to the wait at the mission, not the trip. Two days covers a counter check, seven a normal centre turnaround, and fourteen the busier periods when files sit for over a week.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket Saudi Arabia from ${from}`,
      description: `Verifiable flight reservations for residents of Saudi Arabia, priced in riyals from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Residents of Saudi Arabia',
      description: `Verifiable flight reservations priced in riyals from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Residents of Saudi Arabia',
      description: `Verifiable flight reservation with a PNR on Amadeus, Sabre and Travelport, priced in riyals from ${from}.`,
      price: String(p['2 Days']),
      currency: 'SAR',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for residents of Saudi Arabia from ${from}.`,
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
        title={`Dummy Tickets in Saudi Arabia from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR, created on global GDS platforms (Amadeus, Sabre, Travelport). Residents of the Kingdom use it for Schengen, UK, US and Canadian visa files, for airline check-in and as proof of onward travel. Priced and charged in riyals from ${from}, delivered by email in minutes.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in riyals`,
          'Valid 6-digit PNR',
          'Ready before your appointment',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer
        question="How much does a dummy ticket cost in Saudi Arabia?"
        answer={`A dummy ticket costs ${sar(p['2 Days'])} for 2 days validity, ${sar(p['7 Days'])} for 7 days and ${sar(p['14 Days'])} for 14 days. Those are riyal prices billed in riyals, so a Saudi-issued card picks up no foreign currency markup. Each reservation carries a verifiable PNR on Amadeus, Sabre or Travelport.`}
        tiers={tiersFrom(p, sar)}
      />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and travel dates, pick a validity that covers your appointment window, and pay in riyals. The PDF arrives by email with the PNR ready to submit."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide. A large share of the files we support are assembled by residents of Saudi Arabia applying on a passport from elsewhere. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by consulates and visa application centres across the Kingdom. Priced in riyals from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Policies are arranged on request, so email your trip details to ${EMAIL} and we will prepare your cover.`,
          },
        ]}
      />
      <Benefits
        title="Why Residents of Saudi Arabia Choose Dummy Ticket 365"
        subtitle="Riyal pricing with no conversion markup, a PNR your consulate can check, and delivery quick enough for a next-morning appointment."
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
        subtitle="Country-specific and product-specific options"
        links={[
          {
            anchor: 'Dummy ticket for a Schengen visa',
            href: '/dummy-ticket-schengen-visa',
            blurb: 'Schengen-ready reservation with verifiable PNR, accepted at VFS, BLS and TLScontact.',
          },
          {
            anchor: 'Dummy ticket for a UK visa',
            href: '/dummy-ticket-uk-visa',
            blurb: 'Standard Visitor visa file ready, no paid ticket needed before approval.',
          },
          {
            anchor: 'Dummy ticket for a Canada visa',
            href: '/dummy-ticket-canada-visa',
            blurb: 'Formatted to support TRV and Super Visa applications.',
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
