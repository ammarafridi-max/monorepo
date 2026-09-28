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

const CANONICAL = `${SITE_URL}/ca`;
const FALLBACK = { '2 Days': 18, '7 Days': 28, '14 Days': 32 };

export const revalidate = 300;

// Prices come from the CAD price book so the title can never drift from what
// checkout charges. A Canadian reading a dollar figure and being billed a
// different one is the exact trust problem this page exists to solve.
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
    alternates: { canonical: CANONICAL, languages: hreflangAlternates() },
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
      title: 'Canadian Dollars, Not US Dollars',
      text: `The price on this page is ${from} and that is what your card is charged. No US dollar conversion at checkout, no cross-border fee from your bank, no surprise when the statement lands.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Verifiable PNR on Global GDS',
      text: 'Every reservation carries a six-character PNR created on Amadeus, Sabre or Travelport, the same systems consulates, border officers and IATA travel agents use to confirm a booking during its validity.',
      icon: HiShieldCheck,
    },
    {
      title: 'Proof of Onward Travel at Check-In',
      text: 'Airlines can deny boarding when you cannot show onward travel out of a country with a one-way ticket. A live reservation satisfies the agent at the counter without committing you to a second fare.',
      icon: HiCheckBadge,
    },
    {
      title: 'Real Routes from Canadian Airports',
      text: 'Itineraries use genuine carriers and realistic routings from YYZ, YVR, YUL, YYC, YOW and YEG, including the US and European connections travellers from Canada actually fly.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Delivered While You Wait',
      text: 'The PDF arrives by email within minutes, which matters when an appointment slot opens at short notice or you are already at the airport sorting out a one-way booking.',
      icon: HiOutlineClock,
    },
    {
      title: 'No Fare Locked Up Before Approval',
      text: 'A refundable international fare out of Canada ties up hundreds of dollars and often carries a change penalty. A reservation meets the same documentary requirement without freezing that money.',
      icon: HiArrowsRightLeft,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in Canada?',
      answer: `A dummy ticket costs ${cad(p['2 Days'])} for 2 days validity, ${cad(p['7 Days'])} for 7 days, or ${cad(p['14 Days'])} for 14 days. Those are Canadian dollar amounts charged as shown, not US dollar prices converted at your card rate.`,
    },
    {
      question: 'Am I charged in Canadian dollars or US dollars?',
      answer: 'Canadian dollars. The price is set in CAD and billed in CAD by card through Stripe, so your statement shows the same figure you saw on the page and your bank has no reason to add a foreign currency fee.',
    },
    {
      question: 'Do I need a dummy ticket if I hold a Canadian passport?',
      answer: 'Often yes, though usually not for Europe. A Canadian passport is visa exempt for the Schengen area, but countries such as China, India, Vietnam and Russia still require a visa, and airlines still ask for proof of onward travel when you fly one way.',
    },
    {
      question: 'Can I use this for a visa application submitted from Canada?',
      answer: 'Yes. Applicants living in Canada on a study permit, work permit or permanent residence regularly need a flight reservation for a visa file, and a reservation with a live PNR is what the supporting document lists rather than a paid ticket.',
    },
    {
      question: 'Will the consulate or the airline be able to verify it?',
      answer: 'Yes. The PNR is live on Amadeus, Sabre or Travelport for the validity you choose, so a consulate, an airline agent or any IATA accredited travel agent can look it up. It is a real reservation, not a generated PDF.',
    },
    {
      question: 'How long is the reservation valid?',
      answer: 'You choose 2, 7 or 14 days. Pick the tier that covers the gap between submitting your file and someone checking it, since the PNR has to still be live at the moment they look.',
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
