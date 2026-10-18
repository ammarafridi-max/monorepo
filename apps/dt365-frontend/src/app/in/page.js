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

const CANONICAL = `${SITE_URL}/in`;
const FALLBACK = { '2 Days': 1199, '7 Days': 1799, '14 Days': 2099 };

export const revalidate = 300;

async function getInrPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('INR');
    if (data?.currency !== 'INR' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export async function generateMetadata() {
  const p = await getInrPrices();
  return {
    title: `Dummy Ticket India from ${inr(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket from India with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in rupees from ${inr(p['2 Days'])}, delivered by email in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket India from ${inr(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for Indian travellers, priced in rupees from ${inr(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getInrPrices();
  const from = inr(p['2 Days']);

  const benefits = [
    {
      title: 'Rupee Pricing, Not a Converted Dollar Figure',
      text: `The dummy ticket costs ${from} and your card is billed ${from}. Nothing is quoted in dollars and converted at your bank's rate, so there is no markup hiding between the page and the statement.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Submitted Through VFS and BLS Every Week',
      text: 'Applications from Delhi, Mumbai, Bengaluru, Chennai, Hyderabad and Kolkata go through VFS Global and BLS International, and those checklists ask for a flight reservation rather than a purchased ticket.',
      icon: HiCheckBadge,
    },
    {
      title: 'Dummy Flight Ticket, Flight Itinerary, Same Document',
      text: 'Agents and consulates use different words for it. Whether your checklist says dummy flight ticket, dummy air ticket, flight itinerary or temporary reservation, what it wants is a booking with a retrievable PNR.',
      icon: HiShieldCheck,
    },
    {
      title: 'First-Time Applicants Get Scrutinised Harder',
      text: 'A first Schengen or UK application from India is read more carefully than a renewal. Dates on the reservation that match your cover letter and hotel booking remove the easiest reason to doubt the file.',
      icon: HiGlobeAlt,
    },
    {
      title: 'A Delhi to Europe Fare Is Not Small Money',
      text: 'A flexible long-haul ticket out of India runs into tens of thousands of rupees and the refund arrives weeks later. The documentary requirement is identical whichever one you hold.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'Same Evening When the Slot Opens Tomorrow',
      text: 'VFS appointment slots appear and vanish within hours. The PDF is issued automatically and lands in your inbox in minutes, so a slot found at nine at night is still usable.',
      icon: HiOutlineClock,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in India?',
      answer: `A dummy ticket costs ${inr(p['2 Days'])} for 2 days validity, ${inr(p['7 Days'])} for 7 days, or ${inr(p['14 Days'])} for 14 days. That is the amount charged at checkout in rupees, not a dollar price converted at your card rate.`,
    },
    {
      question: 'Is a dummy flight ticket the same thing?',
      answer: 'Yes. Dummy ticket, dummy flight ticket and dummy air ticket all mean an unticketed reservation held on a global distribution system with a verifiable PNR. Indian agents tend to say dummy flight ticket, consulates tend to say flight reservation, and the document is the same.',
    },
    {
      question: 'Will VFS or the embassy actually check the PNR?',
      answer: 'Sometimes, and you have to assume they will. The record sits on Amadeus, Sabre or Travelport for the validity you choose, so a consulate or any IATA accredited agent can retrieve it and see your name, route and dates.',
    },
    {
      question: 'My travel dates might change. Does that matter?',
      answer: 'What matters is that the reservation agrees with the rest of the application on the day it is reviewed. If your plans shift before you submit, order the corrected itinerary rather than explaining a mismatch in the covering letter.',
    },
    {
      question: 'Which Indian cities do you issue from?',
      answer: 'Any of them. Itineraries most often start from Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad and Kochi, using carriers and connections that genuinely serve those routes.',
    },
    {
      question: 'How long should the booking stay live?',
      answer: 'Long enough to cover the gap between submitting and someone opening the file. Two days suits a same-day appointment, seven covers a normal VFS turnaround, and fourteen is for a consulate that takes its time.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket India from ${from}`,
      description: `Verifiable flight reservations for Indian travellers, priced in rupees from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Indian Travellers',
      description: `Verifiable flight reservations priced in rupees from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Indian Travellers',
      description: `Verifiable flight reservation with a PNR on Amadeus, Sabre and Travelport, priced in rupees from ${from}.`,
      price: String(p['2 Days']),
      currency: 'INR',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for Indian travellers from ${from}.`,
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
        title={`Dummy Tickets in India from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR, created on global GDS platforms (Amadeus, Sabre, Travelport). Indian travellers use it for Schengen, UK, US and Canadian visa files, airline check-in and proof of onward travel. Priced and charged in rupees from ${from}, delivered by email in minutes.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in rupees`,
          'Valid 6-digit PNR',
          'Accepted at VFS and BLS',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer
        question="How much does a dummy ticket cost in India?"
        answer={`A dummy ticket costs ${inr(p['2 Days'])} for 2 days validity, ${inr(p['7 Days'])} for 7 days and ${inr(p['14 Days'])} for 14 days. Those are rupee prices charged in rupees, not dollar prices converted at your card rate. Every reservation carries a verifiable PNR on Amadeus, Sabre or Travelport and reaches you by email within minutes.`}
        tiers={tiersFrom(p, inr)}
      />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and travel dates, pick a validity that covers your appointment window, and pay in rupees. The PDF arrives by email with the PNR ready to submit."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide. Indian applicants are among our largest groups, most often for Schengen, UK, US and Canadian files submitted through VFS Global and BLS International. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by consulates and visa centres across India. Priced in rupees from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Policies are arranged on request, so email your trip details to ${EMAIL} and we will prepare your cover.`,
          },
        ]}
      />
      <Benefits
        title="Why Indian Travellers Choose Dummy Ticket 365"
        subtitle="Rupee pricing, a PNR your consulate can verify, and delivery fast enough for a short-notice VFS appointment."
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
