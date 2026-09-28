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

const CANONICAL = `${SITE_URL}/sa`;
const FALLBACK = { '2 Days': 49, '7 Days': 69, '14 Days': 79 };

export const revalidate = 300;

// Prices come from the SAR price book so the title can never drift from what
// checkout charges.
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
    alternates: { canonical: CANONICAL, languages: hreflangAlternates() },
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
      title: 'Riyals on the Page, Riyals on the Card',
      text: `You see ${from} and your card is charged ${from}. Nothing is quoted in dollars and converted, so a Saudi-issued card picks up no foreign currency markup along the way.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Built Around the Iqama Holder',
      text: 'Most applicants here live in the Kingdom on a residence permit while holding an Indian, Pakistani, Filipino, Egyptian, Bangladeshi or Sudanese passport, so the Schengen, UK, US or Canadian file gets put together in Riyadh or Jeddah rather than back home.',
      icon: HiCheckBadge,
    },
    {
      title: 'Verifiable PNR on Global GDS',
      text: 'Every reservation carries a six-character PNR created on Amadeus, Sabre or Travelport, the same systems consulates and IATA travel agents use to confirm a booking while it is live.',
      icon: HiShieldCheck,
    },
    {
      title: 'Real Routes from Saudi Airports',
      text: 'Itineraries use genuine carriers and realistic routings out of RUH, JED, DMM and MED, including the European, Asian and African connections residents here actually fly.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Ready Before the Appointment',
      text: 'The PDF arrives by email within minutes. Visa application centres in Riyadh, Jeddah and Al Khobar fill their slots quickly, so a file often has to be complete the night before.',
      icon: HiOutlineClock,
    },
    {
      title: 'Nothing Paid Until the Decision Comes',
      text: 'A refundable long-haul fare out of the Kingdom runs into thousands of riyals and the refund takes weeks to come back. A reservation answers the same documentary requirement without tying up the money.',
      icon: HiArrowsRightLeft,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in Saudi Arabia?',
      answer: `A dummy ticket costs ${sar(p['2 Days'])} for 2 days validity, ${sar(p['7 Days'])} for 7 days, or ${sar(p['14 Days'])} for 14 days. Those are riyal amounts billed exactly as shown, not a dollar price converted at your bank's rate.`,
    },
    {
      question: 'Can I pay in riyals?',
      answer: 'Yes. The price is set in SAR and charged in SAR by card through Stripe, so your statement shows the same number you saw on the page.',
    },
    {
      question: 'Is a dummy ticket accepted for a Schengen visa from Saudi Arabia?',
      answer: 'Yes. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a short stay visa rather than a paid ticket, and applications from residents of the Kingdom are submitted through visa application centres in Riyadh, Jeddah and Al Khobar on that basis.',
    },
    {
      question: 'Do I need one for exit and re-entry or a one-way booking?',
      answer: 'Often yes. Airlines check for onward travel at the counter when you hold a one-way booking, and a live reservation covers that without you buying a second fare you do not intend to fly.',
    },
    {
      question: 'Will the consulate be able to verify it?',
      answer: 'Yes. The PNR sits on Amadeus, Sabre or Travelport for the validity you pick, so a consulate or any IATA accredited agent can retrieve it. It is a genuine reservation rather than a PDF made to look like one.',
    },
    {
      question: 'How long is the reservation valid?',
      answer: 'You choose 2, 7 or 14 days. Match the tier to the gap between handing in your file and the consulate opening it, because the PNR has to be live when they check.',
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
