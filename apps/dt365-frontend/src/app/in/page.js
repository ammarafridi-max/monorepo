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
import RelatedPages from '@/components/RelatedPages';
import { testimonials } from '@/data/testimonials';
import { getDummyTicketPricingServerApi } from '@travel-suite/frontend-shared/services/apiPricing';
import { hreflangAlternates } from '@/lib/locales';
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
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineHotel } from 'react-icons/md';

const CANONICAL = `${SITE_URL}/in`;
const FALLBACK = { '2 Days': 1199, '7 Days': 1799, '14 Days': 2099 };

export const revalidate = 300;

// Prices come from the INR price book so the title can never drift from what
// checkout charges. A stale title quoting the wrong rupee figure is the exact
// trust problem this page exists to solve.
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
    alternates: { canonical: CANONICAL, languages: hreflangAlternates() },
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
      title: 'Priced in Rupees, Charged in Rupees',
      text: `You see ${from} and you are charged ${from}. No dollar conversion at checkout, no card foreign exchange surprise, no guessing what the final amount will be when the statement arrives.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Accepted at VFS and BLS Centres in India',
      text: 'Our reservations are submitted every week through VFS Global and BLS International centres in Delhi, Mumbai, Bengaluru, Chennai, Hyderabad and Kolkata for Schengen, UK, US and Canadian applications.',
      icon: HiCheckBadge,
    },
    {
      title: 'Verifiable PNR on Global GDS',
      text: 'Every reservation carries a six-character PNR created on Amadeus, Sabre or Travelport, the same systems consulates and IATA travel agents use to confirm a booking during its validity.',
      icon: HiShieldCheck,
    },
    {
      title: 'Real Routes from Indian Airports',
      text: 'Itineraries use genuine carriers and realistic routings from DEL, BOM, BLR, MAA, HYD and CCU, including the Gulf and European connections Indian applicants actually fly.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Delivered While You Wait',
      text: 'The PDF arrives by email within minutes, which matters when a VFS appointment slot opens at short notice and the file has to be complete the same day.',
      icon: HiOutlineClock,
    },
    {
      title: 'No Ticket Purchased Before Approval',
      text: 'A paid international ticket from India runs into tens of thousands of rupees. A reservation meets the same documentary requirement without locking that money up while the consulate decides.',
      icon: HiArrowsRightLeft,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in India?',
      answer: `A dummy ticket costs ${inr(p['2 Days'])} for 2 days validity, ${inr(p['7 Days'])} for 7 days, or ${inr(p['14 Days'])} for 14 days. That is the amount charged at checkout in rupees, not a dollar price converted at your card rate.`,
    },
    {
      question: 'Is a dummy ticket accepted for a Schengen visa from India?',
      answer: 'Yes. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a short-stay visa, not a paid ticket. VFS Global and BLS International centres across India accept reservations with a verifiable PNR.',
    },
    {
      question: 'Can I pay in rupees?',
      answer: 'Yes. The price is set in rupees and charged in rupees by card through Stripe. Your bank statement shows the same figure you saw on the page.',
    },
    {
      question: 'Will the consulate be able to verify it?',
      answer: 'Yes. The PNR is live on Amadeus, Sabre or Travelport for the validity you choose, so a consulate or any IATA-accredited travel agent can look it up. It is a real reservation, not a generated PDF.',
    },
    {
      question: 'Which Indian cities do you cover?',
      answer: 'All of them. Itineraries can start from any Indian airport, and we most often issue from Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad and Kochi.',
    },
    {
      question: 'How long is the reservation valid?',
      answer: 'You choose 2, 7 or 14 days. Pick the tier that covers the window between submitting your file and the consulate reviewing it, since the PNR must still be live when they check.',
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
            icon: <MdOutlineHotel />,
            title: 'Hotel Reservations',
            description: `Temporary hotel reservations for visa applications, formatted to meet consulate requirements. These are real reservations, not paid bookings. We prepare them on request, so send your trip details to ${EMAIL} and we will have yours ready.`,
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
