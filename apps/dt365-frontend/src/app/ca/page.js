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

const CANONICAL = `${SITE_URL}/ca`;
const FALLBACK = { '2 Days': 18, '7 Days': 28, '14 Days': 32 };

export const revalidate = 300;

async function getCadPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('CAD');
    if (data?.currency !== 'CAD' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const cad = (n) => `CAD ${Number(n).toLocaleString('en-CA')}`;

export async function generateMetadata() {
  const p = await getCadPrices();
  return {
    title: `Dummy Ticket Canada from ${cad(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in Canada with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in Canadian dollars from ${cad(p['2 Days'])}, delivered by email in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket Canada from ${cad(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for travellers in Canada, priced in Canadian dollars from ${cad(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getCadPrices();
  const from = cad(p['2 Days']);

  const benefits = [
    {
      title: 'That Dollar Sign Is Canadian',
      text: `The dummy ticket is ${from} and your card is charged ${from}. No US dollar price converted at checkout, and no cross-border fee from your bank for something that looked domestic.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Newcomers Travel on a Different Passport',
      text: 'A study permit, work permit or PR card gets you back into Canada. The country you are visiting looks at your passport, and an Indian, Nigerian, Filipino or Chinese one needs visas a Canadian one does not.',
      icon: HiCheckBadge,
    },
    {
      title: 'Europe Is Visa Free, Which Changes What You Need',
      text: 'A Canadian passport enters Schengen and the UK without a visa, so the reason here is usually proof of onward travel at check-in, or a visa for China, India, Vietnam or Russia.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Parents and Grandparents Visiting',
      text: 'Super Visa and visitor applications from relatives abroad ask for evidence of intended travel. A dummy flight ticket with a live PNR covers that without anyone buying a fare before the decision lands.',
      icon: HiShieldCheck,
    },
    {
      title: 'Nothing Frozen While IRCC Decides',
      text: 'Processing times move, and a refundable fare out of Toronto or Vancouver ties up several hundred dollars in the meantime, sometimes with a change penalty attached when plans shift.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'Issued While You Are Still at the Counter',
      text: 'Delivery is automatic and takes minutes, which matters when an airline agent at YYZ or YVR has just asked how you are leaving the country you are flying to.',
      icon: HiOutlineClock,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in Canada?',
      answer: `A dummy ticket costs ${cad(p['2 Days'])} for 2 days validity, ${cad(p['7 Days'])} for 7 days, or ${cad(p['14 Days'])} for 14 days. Those are Canadian dollar amounts charged as shown, not US dollar prices converted at your card rate.`,
    },
    {
      question: 'Is a dummy air ticket the same as a dummy ticket?',
      answer: 'Yes. Dummy ticket, dummy air ticket and dummy flight ticket all describe an unticketed reservation with a verifiable PNR. Canadian applications more often use the words flight itinerary or proof of travel, and that is the same document again.',
    },
    {
      question: 'Do I need one if I hold a Canadian passport?',
      answer: 'Often, though not for Europe. A Canadian passport is visa exempt for the Schengen area and the UK, while China, India, Vietnam and Russia still require a visa, and airlines still ask for onward travel on a one-way booking.',
    },
    {
      question: 'Can my parents use this for a Super Visa application?',
      answer: 'A reservation is appropriate evidence of intended travel while the application is pending. Buying a fare before the decision is the risk, since processing times vary and a refusal leaves the cost with the family.',
    },
    {
      question: 'Am I charged in Canadian dollars?',
      answer: 'Yes. The price is set in CAD and billed in CAD through Stripe, so your statement shows the same figure you saw and your bank has no reason to add a foreign currency fee.',
    },
    {
      question: 'How long does the reservation stay live?',
      answer: 'For the tier you pick: 2, 7 or 14 days from delivery. Choose the one that covers the day someone actually checks, not the length of the trip itself.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket Canada from ${from}`,
      description: `Verifiable flight reservations for travellers in Canada, priced in Canadian dollars from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Canada',
      description: `Verifiable flight reservations priced in Canadian dollars from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in Canada',
      description: `Verifiable flight reservation with a PNR on Amadeus, Sabre and Travelport, priced in Canadian dollars from ${from}.`,
      price: String(p['2 Days']),
      currency: 'CAD',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for travellers in Canada from ${from}.`,
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
        title={`Dummy Tickets in Canada from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR, created on global GDS platforms (Amadeus, Sabre, Travelport). Travellers in Canada use it for visa files, airline check-in and proof of onward travel. Priced and charged in Canadian dollars from ${from}, delivered by email in minutes.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in CAD`,
          'Valid 6-digit PNR',
          'No US dollar conversion',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer
        question="How much does a dummy ticket cost in Canada?"
        answer={`A dummy ticket costs ${cad(p['2 Days'])} for 2 days validity, ${cad(p['7 Days'])} for 7 days and ${cad(p['14 Days'])} for 14 days. Those figures are Canadian dollars and your card is charged in Canadian dollars, so there is no US dollar conversion at checkout and no cross-border fee from your bank.`}
        tiers={tiersFrom(p, cad)}
      />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and travel dates, pick a validity that covers the window you need, and pay in Canadian dollars. The PDF arrives by email with the PNR ready to submit."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide, including a large number in Canada who need a reservation for a visa file or for proof of onward travel at check-in. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by consulates and airline staff. Priced in Canadian dollars from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Policies are arranged on request, so email your trip details to ${EMAIL} and we will prepare your cover.`,
          },
        ]}
      />
      <Benefits
        title="Why Travellers in Canada Choose Dummy Ticket 365"
        subtitle="Canadian dollar pricing with no cross-border surprise, a PNR anyone can verify, and delivery fast enough to fix a one-way booking at the counter."
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
            anchor: 'Onward ticket for airline check-in',
            href: '/onward-ticket',
            blurb: 'Proof of onward travel in three validity tiers.',
          },
          {
            anchor: 'Dummy ticket for a Schengen visa',
            href: '/dummy-ticket-schengen-visa',
            blurb: 'Schengen-ready reservation with verifiable PNR, accepted at VFS, BLS and TLScontact.',
          },
          {
            anchor: 'Dummy ticket for a Japan visa',
            href: '/dummy-ticket-japan-visa',
            blurb: 'Itinerary formatted for the documents a Japan application asks for.',
          },
          {
            anchor: 'Dummy ticket for an Australia visa',
            href: '/dummy-ticket-australia-visa',
            blurb: 'Supports visitor and eVisitor applications without a paid fare.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
