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

const CANONICAL = `${SITE_URL}/uk`;
const FALLBACK = { '2 Days': 10, '7 Days': 15, '14 Days': 17 };

export const revalidate = 300;

// Prices come from the GBP price book so the title can never drift from what
// checkout charges.
async function getGbpPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('GBP');
    if (data?.currency !== 'GBP' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const gbp = (n) => `£${Number(n).toLocaleString('en-GB')}`;

export async function generateMetadata() {
  const p = await getGbpPrices();
  return {
    title: `Dummy Ticket UK from ${gbp(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in the UK with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in pounds from ${gbp(p['2 Days'])}, delivered by email in minutes.`,
    alternates: { canonical: CANONICAL, languages: hreflangAlternates() },
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
      title: 'Priced in Pounds, Charged in Pounds',
      text: `The page says ${from} and your card is debited ${from}. No dollar price converted at checkout, so your bank has no reason to add a non-sterling transaction fee.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'For Schengen Files Submitted in the UK',
      text: 'Applicants living here on a work visa, student visa or settled status submit European applications through visa centres in London, Manchester, Edinburgh and Cardiff, and those files ask for a reservation rather than a purchased ticket.',
      icon: HiCheckBadge,
    },
    {
      title: 'Verifiable PNR on Global GDS',
      text: 'Every reservation carries a six-character PNR created on Amadeus, Sabre or Travelport, the same systems consulates and IATA travel agents use to confirm a booking while it is live.',
      icon: HiShieldCheck,
    },
    {
      title: 'Real Routes from UK Airports',
      text: 'Itineraries use genuine carriers and realistic routings from LHR, LGW, MAN, STN, BHX, EDI and GLA, including the European, Asian and African connections travellers here actually fly.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Delivered While You Wait',
      text: 'The PDF arrives by email within minutes, which matters when a biometrics appointment comes up at short notice or an airline queries a one-way booking at the desk.',
      icon: HiOutlineClock,
    },
    {
      title: 'No Fare Tied Up Before a Decision',
      text: 'A flexible long-haul fare from the UK runs into hundreds of pounds and the refund arrives long after you need the money. A reservation satisfies the same requirement without that wait.',
      icon: HiArrowsRightLeft,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in the UK?',
      answer: `A dummy ticket costs ${gbp(p['2 Days'])} for 2 days validity, ${gbp(p['7 Days'])} for 7 days, or ${gbp(p['14 Days'])} for 14 days. Those are sterling amounts charged as shown, not a dollar price converted at your card rate.`,
    },
    {
      question: 'Am I charged in pounds?',
      answer: 'Yes. The price is set in GBP and billed in GBP by card through Stripe, so your statement matches the figure on the page and no non-sterling fee applies.',
    },
    {
      question: 'Do I need a dummy ticket if I hold a British passport?',
      answer: 'Often yes, though not for Europe. A British passport is visa exempt for the Schengen area, but China, India, Vietnam and Russia still require a visa, and airlines still ask for proof of onward travel when you travel on a one-way booking.',
    },
    {
      question: 'Is a flight reservation accepted for a Schengen visa from the UK?',
      answer: 'Yes. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a short stay visa rather than a paid ticket, and centres handling European applications in the UK accept a reservation with a verifiable PNR.',
    },
    {
      question: 'Will the consulate or the airline be able to verify it?',
      answer: 'Yes. The PNR is live on Amadeus, Sabre or Travelport for the validity you choose, so a consulate, an airline agent or any IATA accredited travel agent can retrieve it. It is a real reservation, not a generated PDF.',
    },
    {
      question: 'How long is the reservation valid?',
      answer: 'You choose 2, 7 or 14 days. Pick the tier that covers the gap between submitting your file and someone checking it, since the PNR must still be live at that moment.',
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
