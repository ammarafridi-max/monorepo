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

const CANONICAL = `${SITE_URL}/ae`;
const FALLBACK = { '2 Days': 49, '7 Days': 69, '14 Days': 79 };

export const revalidate = 300;

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
    title: `Dummy Ticket UAE from ${aed(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in the UAE with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in dirhams from ${aed(p['2 Days'])}, delivered by email in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket UAE from ${aed(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for the UAE, priced in dirhams from ${aed(p['2 Days'])}.`,
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
      title: 'Slot Tomorrow, File Ready Tonight',
      text: 'Appointment slots at the Dubai and Abu Dhabi visa centres go quickly and often open at short notice. The PDF reaches your inbox within minutes of payment, so a file can be finished the evening before without rearranging anything.',
      icon: HiOutlineClock,
    },
    {
      title: 'A PNR Your Consulate Can Pull Up',
      text: 'Each booking is created on Amadeus, Sabre or Travelport and carries a live six-character record. Anyone with GDS access can retrieve it and see your name, route and dates for as long as the validity runs.',
      icon: HiShieldCheck,
    },
    {
      title: 'Routings That Match How People Fly From Here',
      text: 'DXB, AUH, SHJ and RKT departures on carriers that genuinely serve those routes, with connection times that hold up. An itinerary showing an impossible transfer is the detail that invites a second look.',
      icon: HiGlobeAlt,
    },
    {
      title: 'Visa Runs and One-Way Bookings',
      text: 'Airline staff ask for onward travel at the counter when your booking ends in the Emirates, and a visit visa is granted against evidence that you are leaving again. A live reservation answers both without a second fare.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'Nothing Paid Until the Decision Lands',
      text: 'A flexible long-haul fare out of Dubai runs into thousands of dirhams and the refund arrives long after you needed the money back. The documentary requirement is the same either way.',
      icon: HiCheckBadge,
    },
  ];

  const faqs = [
    {
      question: 'How much does a dummy ticket cost in the UAE?',
      answer: `A dummy ticket costs ${aed(p['2 Days'])} for 2 days validity, ${aed(p['7 Days'])} for 7 days, or ${aed(p['14 Days'])} for 14 days. Those are dirham amounts billed exactly as shown, not a dollar price converted at your bank's rate.`,
    },
    {
      question: 'Which visa centres in the UAE accept a flight reservation?',
      answer: 'The centres handling European, British, American and Canadian applications across Dubai, Abu Dhabi and Sharjah work from the checklist published by the mission concerned, and those checklists ask for a flight reservation rather than a purchased ticket. Bring the PDF and the PNR will resolve if anyone checks.',
    },
    {
      question: 'I live here on a residence visa but hold another passport. Does that change anything?',
      answer: 'Not for the reservation itself. Your nationality decides which visa you need and what else goes in the file, but the flight booking requirement is the same, and applying from the Emirates rather than your home country makes no difference to how the PNR is verified.',
    },
    {
      question: 'Do I need one for a visa run or a one-way booking into the UAE?',
      answer: 'Usually yes. Airlines check for onward travel at check-in when your booking has no return leg, and entry as a visitor is granted against evidence that you intend to leave. A live reservation satisfies both without committing you to a flight.',
    },
    {
      question: 'Agents here say dummy flight ticket. Is that different?',
      answer:
        'No. Dummy ticket, dummy flight ticket and dummy air ticket all describe an unticketed reservation with a PNR that resolves on the GDS. Travel agencies across the Emirates use the terms interchangeably, and the visa centres tend to write flight reservation on the checklist.',
    },
    {
      question: 'Can I pay with a UAE card?',
      answer: 'Yes, and it is billed in dirhams. The price is set in AED rather than converted at checkout, so your statement shows the same figure you saw here and your bank has nothing to add a cross-border fee to.',
    },
    {
      question: 'How long should I make the booking valid for?',
      answer: 'Match it to the wait, not to your trip. Two days covers a counter check or a same-day appointment, seven covers a typical centre turnaround, and fourteen is for a mission that holds files for a week or more before opening them.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket UAE from ${from}`,
      description: `Verifiable flight reservations for the UAE, priced in dirhams from ${from}.`,
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
        title={`Dummy Tickets in the UAE from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR, created on Amadeus, Sabre and Travelport. In the Emirates it goes into visa files, satisfies an airline asking for onward travel, and covers a visit visa that needs proof you are leaving. Priced and charged in dirhams from ${from}, emailed within minutes.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in dirhams`,
          'Valid 6-digit PNR',
          'Ready before your appointment',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer
        question="How much does a dummy ticket cost in the UAE?"
        answer={`A dummy ticket costs ${aed(p['2 Days'])} for 2 days validity, ${aed(p['7 Days'])} for 7 days and ${aed(p['14 Days'])} for 14 days. Those are dirham prices billed in dirhams, so a UAE-issued card picks up no foreign currency markup. Each reservation carries a verifiable PNR on Amadeus, Sabre or Travelport.`}
        tiers={tiersFrom(p, aed)}
      />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and travel dates, pick a validity that covers your appointment window, and pay in dirhams. The PDF arrives by email with the PNR ready to submit."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide, with the Emirates among the markets we serve most. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by consulates and visa application centres across the Emirates. Priced in dirhams from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Policies are arranged on request, so email your trip details to ${EMAIL} and we will prepare your cover.`,
          },
        ]}
      />
      <Benefits
        title="Why People in the UAE Book With Dummy Ticket 365"
        subtitle="Dirham pricing, a record anyone can retrieve, and delivery fast enough for a slot that opened this afternoon."
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
