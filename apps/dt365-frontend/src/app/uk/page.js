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
  HiCheckBadge,
  HiGlobeAlt,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety } from 'react-icons/md';

const CANONICAL = `${SITE_URL}/uk`;

export const revalidate = 300;

async function getGbpPrices() {
  return getLocalePrices('GBP');
}

const gbp = (n) => `£${Number(n).toLocaleString('en-GB')}`;

export async function generateMetadata() {
  const p = await getGbpPrices();
  return {
    title: `Dummy Ticket UK from ${gbp(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in the UK with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in pounds from ${gbp(p['2 Days'])}, delivered by email in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket UK from ${gbp(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for travellers in the UK, priced in pounds from ${gbp(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getGbpPrices();
  const from = gbp(p['2 Days']);

  const benefits = [
    {
      title: 'Sterling In, Sterling Out',
      text: `The dummy ticket is ${from} and that is what leaves your account. No dollar figure converted at checkout, so your bank has nothing to attach a non-sterling transaction fee to.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Europe Needs Paperwork Again',
      text: 'A British passport no longer walks into the Schengen area for long stays or work, and applications submitted here through centres in London, Manchester and Edinburgh ask for a reservation rather than a bought ticket.',
      icon: HiCheckBadge,
    },
    {
      title: 'Settled Status Does Not Change Your Passport',
      text: 'People living here on a BRP, a skilled worker visa or settled status travel on the passport they hold, and an Indian, Nigerian, Pakistani or Filipino one carries its own visa requirements.',
      icon: HiShieldCheck,
    },
    {
      title: 'Biometrics Dates Move, Fares Do Not',
      text: 'Appointment slots get rescheduled at short notice. A reservation can be reissued for the new date for a few pounds, where a flexible fare charges you for the privilege.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'Dummy Flight Ticket Is the Same Thing',
      text: 'Checklists and agents use dummy ticket, dummy flight ticket, dummy air ticket and flight itinerary interchangeably. All of them mean a live booking with a PNR someone can retrieve.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Minutes, Not the Next Working Day',
      text: 'Issued automatically and emailed straight away, so an application you are finishing on a Sunday evening does not wait for an office to open on Monday.',
      icon: HiOutlineClock,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in the UK?',
      answer: `A dummy ticket costs ${gbp(p['2 Days'])} for 2 days validity, ${gbp(p['7 Days'])} for 7 days, or ${gbp(p['14 Days'])} for 14 days. Those are sterling amounts charged as shown, not a dollar price converted at your card rate.`,
    },
    {
      question: 'Do checklists mean something different by dummy flight ticket?',
      answer: 'No. Dummy ticket, dummy flight ticket and dummy air ticket all point at an unticketed reservation with a retrievable PNR. UK and European forms usually say flight reservation or travel itinerary, which is the same document under a more formal name.',
    },
    {
      question: 'Is a reservation accepted for a Schengen visa applied for in the UK?',
      answer: 'Yes. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a short stay visa rather than a purchased ticket, and the centres handling European applications here work from that checklist.',
    },
    {
      question: 'Do I need one with a British passport?',
      answer: 'Not for short trips to Europe, which remain visa free. China, India, Vietnam and Russia still require a visa, and airlines still ask for proof of onward travel when you fly on a one-way booking.',
    },
    {
      question: 'What if my appointment gets moved?',
      answer: 'Order the itinerary again for the new dates. Nothing was purchased, so nothing is lost, and the old booking simply lapses at the end of its validity window.',
    },
    {
      question: 'Which validity suits a UK-submitted application?',
      answer: 'Seven days covers most visa centre turnarounds here. Two days is enough for an airline desk, and fourteen is worth it when a consulate is known to hold files for over a week.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket UK from ${from}`,
      description: `Verifiable flight reservations for travellers in the UK, priced in pounds from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in the UK',
      description: `Verifiable flight reservations priced in pounds from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in the UK',
      description: `Verifiable flight reservation with a PNR on Amadeus, Sabre and Travelport, priced in pounds from ${from}.`,
      price: String(p['2 Days']),
      currency: 'GBP',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for travellers in the UK from ${from}.`,
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
        title={`Dummy Tickets in the UK from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR, created on global GDS platforms (Amadeus, Sabre, Travelport). Travellers in the UK use it for visa files, airline check-in and proof of onward travel. Priced and charged in pounds from ${from}, delivered by email in minutes.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in pounds`,
          'Valid 6-digit PNR',
          'No non-sterling fee',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer
        question="How much does a dummy ticket cost in the UK?"
        answer={`A dummy ticket costs ${gbp(p['2 Days'])} for 2 days validity, ${gbp(p['7 Days'])} for 7 days and ${gbp(p['14 Days'])} for 14 days. Those are sterling prices charged in sterling, so no non-sterling transaction fee applies. Each reservation carries a verifiable PNR on Amadeus, Sabre or Travelport.`}
        tiers={tiersFrom(p, gbp)}
      />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and travel dates, pick a validity that covers your appointment window, and pay in pounds. The PDF arrives by email with the PNR ready to submit."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide, including many in the UK who need a reservation for a European visa file or as proof of onward travel at check-in. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by consulates and airline staff. Priced in pounds from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Policies are arranged on request, so email your trip details to ${EMAIL} and we will prepare your cover.`,
          },
        ]}
      />
      <Benefits
        title="Why Travellers in the UK Choose Dummy Ticket 365"
        subtitle="Sterling pricing with no conversion fee, a PNR your consulate can verify, and delivery fast enough for a short-notice appointment."
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
            anchor: 'Onward ticket for airline check-in',
            href: '/onward-ticket',
            blurb: 'Proof of onward travel in three validity tiers.',
          },
          {
            anchor: 'Dummy ticket for a Japan visa',
            href: '/dummy-ticket-japan-visa',
            blurb: 'Itinerary formatted for the documents a Japan application asks for.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
