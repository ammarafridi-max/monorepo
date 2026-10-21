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
import { getLocalePrices, tiersFrom } from '@/lib/tiers';
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
  HiBanknotes,
  HiBolt,
  HiGlobeAlt,
  HiShieldCheck,
  HiUsers,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety } from 'react-icons/md';

const CANONICAL = `${SITE_URL}/de`;

export const revalidate = 300;

async function getEurPrices() {
  return getLocalePrices('EUR');
}

const eur = (n) => `€${Number(n).toLocaleString('de-DE')}`;

const QUESTION = 'Do you need a dummy ticket if you live in Germany?';
const ANSWER =
  'Not for Europe, but often for everywhere else. Germany is inside Schengen, so the trips that need paperwork are the ones leaving it: a United States, Canadian, Chinese or Indian visa, or an airline asking for onward travel on a one-way booking. Residents here on a non-EU passport need it far more often.';

export async function generateMetadata() {
  const p = await getEurPrices();
  return {
    title: `Dummy Ticket Germany from ${eur(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in Germany with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in euros from ${eur(p['2 Days'])}, emailed in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket Germany from ${eur(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations priced in euros from ${eur(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getEurPrices();
  const from = eur(p['2 Days']);

  const benefits = [
    {
      title: 'Euros, Not a Converted Dollar Price',
      text: `The page shows ${from} and your card is charged ${from}. No conversion at checkout and no Auslandseinsatzentgelt from your bank for a purchase that reads as local.`,
      icon: HiBanknotes,
    },
    {
      title: 'For the Trips That Leave Schengen',
      text: 'Inside Europe you need nothing. A United States, Canadian, Chinese, Indian or Russian application is where a flight reservation gets asked for, and those checklists want a booking rather than a purchased fare.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Non-EU Residents, German Address',
      text: 'An Aufenthaltstitel does not change which passport you travel on. People living here on an Indian, Turkish, Nigerian or Chinese passport carry the visa requirements of that passport, and need this far more often than their neighbours do.',
      icon: HiUsers,
    },
    {
      title: 'A Record the Consulate Can Retrieve',
      text: 'Every booking is created on Amadeus, Sabre or Travelport and carries a live six-character PNR that anyone with GDS access can look up while the validity runs.',
      icon: HiShieldCheck,
    },
    {
      title: 'Frankfurt and Munich Routings That Hold Up',
      text: 'Itineraries use carriers that genuinely fly from FRA, MUC, BER, DUS and HAM, with connection times that make sense. An impossible transfer is the detail that invites a closer look.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'Issued in Minutes',
      text: 'The PDF is generated and emailed straight away, which matters when a Termin at a consulate comes up at short notice and the file has to be complete before it.',
      icon: HiBolt,
    },
  ];

  const faqs = [
    { question: QUESTION, answer: ANSWER },
    {
      question: 'How much does a dummy ticket cost in Germany?',
      answer: `It costs ${eur(p['2 Days'])} for 2 days validity, ${eur(p['7 Days'])} for 7 days or ${eur(p['14 Days'])} for 14 days. Those are euro prices billed in euros, so nothing changes between the page and your bank statement.`,
    },
    {
      question: 'Does this work for a US visa interview appointment?',
      answer: 'A reservation is appropriate while the application is pending, and buying a ticket before the visa is issued is widely discouraged precisely because a refusal leaves you holding the fare. Check the specific instructions for your consulate, since requirements differ by category.',
    },
    {
      question: 'I live in Germany on a residence permit. Whose rules apply?',
      answer: 'Your passport decides what you need, and your German residence usually decides where you apply. That combination is the common case here: applying in Berlin or Munich for a visa that a German passport would never require.',
    },
    {
      question: 'Can I pay with SEPA or a German card?',
      answer: 'Payment is by card through Stripe and billed in euros, so a German-issued card is charged the exact amount shown with no currency conversion applied. The product is the same whether you searched for a dummy ticket, a dummy flight ticket or a Flugreservierung.',
    },
    {
      question: 'Is the price the same elsewhere in the euro area?',
      answer: 'Yes. The euro price book serves Austria, the Netherlands, Ireland, Italy, France, Portugal and the rest of the single currency area, so the figure you see here is the figure charged there too.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket Germany from ${from}`,
      description: `Verifiable flight reservations priced in euros from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Germany',
      description: `Verifiable flight reservations priced in euros from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Germany',
      description: `Unticketed flight reservation with a verifiable PNR, priced in euros from ${from}.`,
      price: String(p['2 Days']),
      currency: 'EUR',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for travellers in Germany from ${from}.`,
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
        title={`Dummy Tickets in Germany from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR on Amadeus, Sabre or Travelport. From Germany the need is for the trips that leave Schengen: a US, Canadian, Chinese or Indian visa file, or an airline asking for onward travel. Priced and charged in euros from ${from}.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in euros`,
          'Valid 6-digit PNR',
          'No conversion at checkout',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={tiersFrom(p, eur)} />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and dates, choose how long the booking stays live, and pay in euros. The PDF arrives by email."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide, including across the euro area. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by consulates and airline staff. Priced in euros from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Arranged on request, so email your trip details to ${EMAIL}.`,
          },
        ]}
      />
      <Benefits
        title="Why Travellers in Germany Book With Dummy Ticket 365"
        subtitle="Euro pricing, a record your consulate can check, and delivery before the appointment"
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
            anchor: 'Dummy ticket for any visa application',
            href: '/dummy-ticket-for-visa',
            blurb: 'What each visa type asks for, and which accept a reservation.',
          },
          {
            anchor: 'Onward ticket for airline check-in',
            href: '/onward-ticket',
            blurb: 'Proof of onward travel in three validity tiers.',
          },
          {
            anchor: 'Dummy ticket on Lufthansa',
            href: '/lufthansa-dummy-ticket',
            blurb: 'Frankfurt or Munich routing, issued on the same global systems.',
          },
          {
            anchor: 'Multi city dummy ticket',
            href: '/multi-city-dummy-ticket',
            blurb: 'Several legs under one PNR for a longer itinerary.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
