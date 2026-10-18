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
  HiBanknotes,
  HiGlobeAlt,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety } from 'react-icons/md';

const CANONICAL = `${SITE_URL}/au`;
const FALLBACK = { '2 Days': 19, '7 Days': 28, '14 Days': 31 };

export const revalidate = 300;

async function getAudPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('AUD');
    if (data?.currency !== 'AUD' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const aud = (n) => `AUD ${Number(n).toLocaleString('en-AU')}`;

const QUESTION = 'Do Australians need a dummy ticket?';
const ANSWER =
  'Often, though rarely for Europe. An Australian passport enters the Schengen area and the UK without a visa, so the usual reason here is proof of onward travel at check-in, or a visa for somewhere that still requires one, such as China, India, Vietnam or Russia. Airlines ask for it when you fly one way.';

export async function generateMetadata() {
  const p = await getAudPrices();
  return {
    title: `Dummy Ticket Australia from ${aud(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in Australia with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in Australian dollars from ${aud(p['2 Days'])}, emailed in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket Australia from ${aud(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for Australia, priced in Australian dollars from ${aud(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getAudPrices();
  const from = aud(p['2 Days']);

  const benefits = [
    {
      title: 'That Dollar Sign Means Australian Dollars',
      text: `The price here is ${from} and your card is debited ${from}. No US dollar figure converted at checkout, and no international transaction fee from your bank for a purchase that looked local.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'One-Way Out of Australia',
      text: 'Check-in staff at Sydney, Melbourne and Brisbane ask for onward travel when your booking has no return leg, and so do immigration officers at the other end. A live reservation answers both.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'For the Countries That Still Want a Visa',
      text: 'Europe and the UK let an Australian passport in without one. China, India, Vietnam and Russia do not, and those forms ask for a dummy flight ticket or flight reservation rather than a purchased fare.',
      icon: HiGlobeAlt,
    },
    {
      title: 'A Record the Consulate Can Retrieve',
      text: 'Every booking is made on Amadeus, Sabre or Travelport and carries a live six-character PNR. Anyone with GDS access can pull it up and see the passenger name, route and dates.',
      icon: HiShieldCheck,
    },
    {
      title: 'Long-Haul Fares Are the Expensive Mistake',
      text: 'A flexible fare out of Australia is among the dearest in the world and the refund takes weeks. The documentary requirement is identical whether you hold a reservation or a ticket.',
      icon: HiBanknotes,
    },
    {
      title: 'Timezone Is Not a Problem',
      text: 'The reservation is issued automatically and arrives within minutes, whatever the hour in Sydney. You are not waiting on an office in another hemisphere to open.',
      icon: HiOutlineClock,
    },
  ];

  const faqs = [
    { question: QUESTION, answer: ANSWER },
    {
      question: 'How much does a dummy ticket cost in Australia?',
      answer: `It costs ${aud(p['2 Days'])} for 2 days validity, ${aud(p['7 Days'])} for 7 days or ${aud(p['14 Days'])} for 14 days. Those figures are Australian dollars and your card is charged in Australian dollars, so nothing shifts between the page and your statement.`,
    },
    {
      question: 'Will an airline accept it as proof of onward travel?',
      answer: 'That is the most common use for it here. The agent is checking that you have a booking leaving the destination inside your permitted stay, and a live PNR satisfies that. It is not a boarding pass and does not need to be.',
    },
    {
      question: 'I am travelling on a working holiday visa. Does that change anything?',
      answer: 'The reservation itself is the same document. What changes is how long you need it live, since a longer trip usually means a later onward date. Pick the validity that covers the moment someone is likely to ask, not the length of the trip.',
    },
    {
      question: 'Can I use it for a Chinese or Indian visa application?',
      answer: 'Yes. Both ask for evidence of your intended travel, and a reservation with a retrievable PNR is what the checklist describes. Make sure the dates line up with the rest of your application.',
    },
    {
      question: 'Why not just buy a refundable ticket?',
      answer: 'You can, and from Australia it will cost hundreds of dollars with the refund arriving weeks later, sometimes with a change fee attached. The reservation meets the same requirement for the price of lunch.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket Australia from ${from}`,
      description: `Verifiable flight reservations for Australia, priced in Australian dollars from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Australia',
      description: `Verifiable flight reservations priced in Australian dollars from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Australia',
      description: `Unticketed flight reservation with a verifiable PNR, priced in Australian dollars from ${from}.`,
      price: String(p['2 Days']),
      currency: 'AUD',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for travellers in Australia from ${from}.`,
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
        title={`Dummy Tickets in Australia from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR on Amadeus, Sabre or Travelport. In Australia it is mostly used as proof of onward travel at check-in, and for the visas an Australian passport still needs. Priced and charged in Australian dollars from ${from}, emailed within minutes.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in AUD`,
          'Valid 6-digit PNR',
          'Accepted at airline check-in',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={tiersFrom(p, aud)} />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and dates, pick how long the booking needs to stay live, and pay in Australian dollars. The PDF arrives by email."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide, with Australia among the markets we serve most. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by airline staff and consulates. Priced in Australian dollars from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Arranged on request, so email your trip details to ${EMAIL}.`,
          },
        ]}
      />
      <Benefits
        title="Why Travellers in Australia Book With Dummy Ticket 365"
        subtitle="Australian dollar pricing, a record anyone can check, and no overnight wait"
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
            anchor: 'Dummy ticket for an Australia visa',
            href: '/dummy-ticket-australia-visa',
            blurb: 'Formatted for the Subclass 600 ImmiAccount upload.',
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
          {
            anchor: 'Multi city dummy ticket',
            href: '/multi-city-dummy-ticket',
            blurb: 'Several legs under one PNR for a longer trip.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
