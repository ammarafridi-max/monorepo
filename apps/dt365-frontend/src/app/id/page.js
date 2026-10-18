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
  HiCalendarDays,
  HiMapPin,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety } from 'react-icons/md';

const CANONICAL = `${SITE_URL}/id`;
const FALLBACK = { '2 Days': 235000, '7 Days': 345000, '14 Days': 379000 };

export const revalidate = 300;

async function getIdrPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('IDR');
    if (data?.currency !== 'IDR' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const idr = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;

const QUESTION = 'What does an Indonesian traveller need a dummy ticket for?';
const ANSWER =
  'Mostly for visa applications and for the check-in desk. An Indonesian passport needs a visa for Europe, the United Kingdom, the United States and Australia, and all of those ask for a flight reservation rather than a paid ticket. Airlines also ask for onward travel when you leave on a one-way booking.';

export async function generateMetadata() {
  const p = await getIdrPrices();
  return {
    title: `Dummy Ticket Indonesia from ${idr(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in Indonesia with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in rupiah from ${idr(p['2 Days'])}, emailed in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket Indonesia from ${idr(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for Indonesia, priced in rupiah from ${idr(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getIdrPrices();
  const from = idr(p['2 Days']);

  const benefits = [
    {
      title: 'Rupiah on the Page, Rupiah on the Card',
      text: `The price is ${from} and that is what your card is charged. Nothing is quoted in dollars and converted, so an Indonesian card picks up no foreign currency markup.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'For the Visas an Indonesian Passport Needs',
      text: 'Schengen, UK, US and Australian applications all ask for evidence of your travel plan, and all accept a reservation. That is the bulk of what we issue for travellers here.',
      icon: HiCalendarDays,
    },
    {
      title: 'Leaving on a One-Way Booking',
      text: 'The agent at Soekarno-Hatta or Ngurah Rai will ask how you are leaving the destination. A live reservation answers it without buying a return you have no intention of flying.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'A PNR That Resolves When Checked',
      text: 'Bookings are created on Amadeus, Sabre or Travelport with a six-character record. A consulate or an IATA accredited agent can retrieve it for as long as the validity runs.',
      icon: HiShieldCheck,
    },
    {
      title: 'Real Routes from Indonesian Airports',
      text: 'Itineraries depart CGK, DPS, SUB and UPG on carriers that genuinely serve those routes, including the Gulf and Asian connections most travellers here actually connect through.',
      icon: HiMapPin,
    },
    {
      title: 'Minutes, Not a Working Day',
      text: 'Issued automatically and emailed immediately, so an appointment tomorrow morning does not depend on anyone being at a desk tonight.',
      icon: HiBolt,
    },
  ];

  const faqs = [
    { question: QUESTION, answer: ANSWER },
    {
      question: 'How much does a dummy ticket cost in Indonesia?',
      answer: `It costs ${idr(p['2 Days'])} for 2 days validity, ${idr(p['7 Days'])} for 7 days or ${idr(p['14 Days'])} for 14 days. Those are rupiah prices billed in rupiah, so the number on the page is the number on your statement.`,
    },
    {
      question: 'Is a reservation accepted for a Schengen visa from Jakarta?',
      answer: 'Yes. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a short stay visa rather than a purchased ticket. The booking needs to still be live when the consulate opens your file, so match the validity to the appointment.',
    },
    {
      question: 'Can I pay with a local card or an Indonesian bank?',
      answer: 'Payment is by card through Stripe and charged in rupiah, so an Indonesian card is billed exactly the amount shown with no conversion applied.',
    },
    {
      question: 'Does it work for Umrah or other travel through the Gulf?',
      answer: 'It works wherever a reservation rather than a ticket is what is being asked for, including airline checks on connecting routes. If your operator requires a confirmed purchased ticket, buy that instead.',
    },
    {
      question: 'Which validity should I choose?',
      answer: 'Two days suits a check-in desk or a same-day appointment, seven days covers a typical visa centre turnaround, and fourteen days is for a mission that holds applications for a week or more.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket Indonesia from ${from}`,
      description: `Verifiable flight reservations for Indonesia, priced in rupiah from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Indonesia',
      description: `Verifiable flight reservations priced in rupiah from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Indonesia',
      description: `Unticketed flight reservation with a verifiable PNR, priced in rupiah from ${from}.`,
      price: String(p['2 Days']),
      currency: 'IDR',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for travellers in Indonesia from ${from}.`,
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
        title={`Dummy Tickets in Indonesia from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR on Amadeus, Sabre or Travelport. Indonesian travellers use it for Schengen, UK, US and Australian visa files, and at the check-in desk when leaving on a one-way booking. Priced and charged in rupiah from ${from}.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in rupiah`,
          'Valid 6-digit PNR',
          'Accepted by consulates',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={tiersFrom(p, idr)} />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and dates, choose how long the booking stays live, and pay in rupiah. The PDF arrives by email."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide, Indonesia included. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by consulates and airline staff. Priced in rupiah from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Arranged on request, so email your trip details to ${EMAIL}.`,
          },
        ]}
      />
      <Benefits
        title="Why Travellers in Indonesia Book With Dummy Ticket 365"
        subtitle="Rupiah pricing, a record a consulate can retrieve, and same-night delivery"
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
            anchor: 'Onward ticket for airline check-in',
            href: '/onward-ticket',
            blurb: 'Proof of onward travel in three validity tiers.',
          },
          {
            anchor: 'Verifiable dummy ticket',
            href: '/verifiable-dummy-ticket',
            blurb: 'How a consulate retrieves the record, and what a generated PDF fails on.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
