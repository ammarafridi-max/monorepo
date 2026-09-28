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

const CANONICAL = `${SITE_URL}/ae`;
const FALLBACK = { '2 Days': 49, '7 Days': 69, '14 Days': 79 };

export const revalidate = 300;

// Prices come from the AED price book so the title can never drift from what
// checkout charges.
async function getAedPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('AED');
    if (data?.currency !== 'AED' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const aed = (n) => `AED ${Number(n).toLocaleString('en-AE')}`;

export async function generateMetadata() {
  const p = await getAedPrices();
  return {
    title: `Dummy Ticket for UAE Residents from ${aed(p['2 Days'])} | Visa & Check-In`,
    description: `Living in the Emirates and applying on a passport from elsewhere? Get a flight reservation with a GDS PNR for your Schengen, UK, US or Canadian file. Dirham pricing from ${aed(p['2 Days'])}.`,
    alternates: { canonical: CANONICAL, languages: hreflangAlternates() },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket for UAE Residents from ${aed(p['2 Days'])} | Visa & Check-In`,
      description: `Flight reservations for residents of the Emirates applying on a third-country passport, priced in dirhams from ${aed(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getAedPrices();
  const from = aed(p['2 Days']);

  const benefits = [
    {
      title: 'Dirhams on the Page, Dirhams on the Card',
      text: `You see ${from} and your card is charged ${from}. Nothing is quoted in dollars and converted, so a UAE-issued card picks up no foreign currency markup on the way through.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Built for Residents Applying on a Third Passport',
      text: 'Most applicants here hold a UAE residence visa on an Indian, Pakistani, Filipino, Egyptian, Nigerian or Jordanian passport, which means a Schengen, UK, US or Canadian file assembled in Dubai or Abu Dhabi rather than back home.',
      icon: HiCheckBadge,
    },
    {
      title: 'Verifiable PNR on Global GDS',
      text: 'Every reservation carries a six-character PNR created on Amadeus, Sabre or Travelport, the same systems consulates and IATA travel agents use to confirm a booking while it is live.',
      icon: HiShieldCheck,
    },
    {
      title: 'Real Routes from UAE Airports',
      text: 'Itineraries use genuine carriers and realistic routings out of DXB, AUH, SHJ and RKT, including the European, Asian and African connections residents here actually fly.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Same-Day When the Appointment Is Tomorrow',
      text: 'The PDF arrives by email within minutes. Visa application centres in the Emirates fill their slots quickly, so a file often has to be complete the evening before.',
      icon: HiOutlineClock,
    },
    {
      title: 'Nothing Paid Until the Decision Comes',
      text: 'A refundable long-haul fare out of Dubai can run to several thousand dirhams and the refund takes weeks. A reservation answers the same documentary requirement without tying up the money.',
      icon: HiArrowsRightLeft,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in the UAE?',
      answer: `A dummy ticket costs ${aed(p['2 Days'])} for 2 days validity, ${aed(p['7 Days'])} for 7 days, or ${aed(p['14 Days'])} for 14 days. Those are dirham amounts billed exactly as shown, not a dollar price converted at your bank's rate.`,
    },
    {
      question: 'Can I pay in dirhams?',
      answer: 'Yes. The price is set in AED and charged in AED by card through Stripe, so your statement shows the same number you saw on the page.',
    },
    {
      question: 'Is a dummy ticket accepted for a Schengen visa from the UAE?',
      answer: 'Yes. EU Visa Code Article 14 lists a flight reservation among the supporting documents for a short stay visa rather than a paid ticket, and applications from UAE residents are submitted through visa application centres in Dubai, Abu Dhabi and Sharjah on that basis.',
    },
    {
      question: 'Do I need one for a UAE tourist visa or a visa run?',
      answer: 'Usually yes. Entry as a visitor is granted against evidence that you are leaving again, and airlines check for onward travel at the counter when you hold a one-way booking. A live reservation covers that without buying a second fare.',
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
      title: `Dummy Ticket for UAE Residents from ${from}`,
      description: `Flight reservations for residents of the Emirates applying on a third-country passport, priced in dirhams from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for UAE Residents',
      description: `Verifiable flight reservations priced in dirhams from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for UAE Residents',
      description: `Verifiable flight reservation with a PNR on Amadeus, Sabre and Travelport, priced in dirhams from ${from}.`,
      price: String(p['2 Days']),
      currency: 'AED',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for UAE residents from ${from}.`,
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
        title={`Dummy Tickets for Residents of the UAE from ${from}`}
        subtitle={`Most people who order from us in the Emirates hold a residence visa on a passport from somewhere else, which means assembling a Schengen, UK, US or Canadian file here rather than back home. A dummy ticket is a real flight reservation with a PNR on Amadeus, Sabre or Travelport, priced and charged in dirhams from ${from} and emailed within minutes.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in dirhams`,
          'Valid 6-digit PNR',
          'Ready before your appointment',
          'Delivered in minutes',
        ]}
      />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and travel dates, pick a validity that covers your appointment window, and pay in dirhams. The PDF arrives by email with the PNR ready to submit."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide. A large share of the files we support are assembled by residents of the Emirates applying on a passport from elsewhere. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by consulates and visa application centres across the Emirates. Priced in dirhams from ${from}.`,
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
        title="Why Residents in the UAE Choose Dummy Ticket 365"
        subtitle="Dirham pricing with no conversion markup, a PNR your consulate can check, and delivery quick enough for a next-morning appointment."
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
