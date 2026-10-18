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
  HiBolt,
  HiIdentification,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
  HiTicket,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety } from 'react-icons/md';

const CANONICAL = `${SITE_URL}/ph`;
const FALLBACK = { '2 Days': 849, '7 Days': 1199, '14 Days': 1349 };

export const revalidate = 300;

async function getPhpPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('PHP');
    if (data?.currency !== 'PHP' || !data?.options?.length) return FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return FALLBACK;
  }
}

const php = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

const QUESTION = 'Why are Filipino travellers asked for a return ticket so often?';
const ANSWER =
  'Because the airline carries the cost if you are refused entry. Carriers check onward travel closely for passengers who need a visa at the destination, and a Philippine passport needs one in most places. A live flight reservation satisfies the agent at the counter without you buying a return you do not intend to fly.';

export async function generateMetadata() {
  const p = await getPhpPrices();
  return {
    title: `Dummy Ticket Philippines from ${php(p['2 Days'])} | Verifiable PNR`,
    description: `Book a dummy ticket in the Philippines with a verifiable PNR on Amadeus, Sabre and Travelport. Priced in pesos from ${php(p['2 Days'])}, emailed in minutes.`,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      url: CANONICAL,
      title: `Dummy Ticket Philippines from ${php(p['2 Days'])} | Verifiable PNR`,
      description: `Verifiable flight reservations for the Philippines, priced in pesos from ${php(p['2 Days'])}.`,
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function Page() {
  const p = await getPhpPrices();
  const from = php(p['2 Days']);

  const benefits = [
    {
      title: 'Pesos on the Page, Pesos on the Card',
      text: `You see ${from} and that is the amount charged. No dollar figure converted at your bank's rate, and no foreign transaction fee added to a purchase that looked local.`,
      icon: HiOutlineCurrencyDollar,
    },
    {
      title: 'Built for the Counter at NAIA',
      text: 'The question at check-in is how you are leaving the destination within your permitted stay. A reservation with a live PNR answers it, which is the moment most of our Philippine customers actually need this.',
      icon: HiTicket,
    },
    {
      title: 'Works Alongside Your Other Papers',
      text: 'Departing Filipino travellers are often asked to show their travel plan as a whole. A clean itinerary with a retrievable PNR sits naturally beside employment papers, invitations or a visa.',
      icon: HiIdentification,
    },
    {
      title: 'A Booking That Can Be Checked',
      text: 'Each reservation is created on Amadeus, Sabre or Travelport and carries a six-character record. An airline or a consulate can pull it up for as long as the validity you chose is running.',
      icon: HiShieldCheck,
    },
    {
      title: 'One Way Out, Nothing Wasted',
      text: 'Buying a throwaway return so an agent will let you board is an expensive habit. The documentary requirement is the same and a reservation costs a fraction of the fare.',
      icon: HiArrowsRightLeft,
    },
    {
      title: 'Delivered in Minutes, Any Hour',
      text: 'Issued automatically and emailed straight away, so a flight at dawn from Manila or Cebu does not mean waiting for an office to open somewhere else.',
      icon: HiBolt,
    },
  ];

  const faqs = [
    { question: QUESTION, answer: ANSWER },
    {
      question: 'How much does a dummy ticket cost in the Philippines?',
      answer: `It costs ${php(p['2 Days'])} for 2 days validity, ${php(p['7 Days'])} for 7 days or ${php(p['14 Days'])} for 14 days. Those are peso prices charged in pesos, so the figure on the page is the figure on your statement.`,
    },
    {
      question: 'Will the airline accept a reservation instead of a paid ticket?',
      answer: 'For proof of onward travel, yes. The agent is confirming that a booking exists showing you leave within the permitted stay, and a live PNR does that. What fails is a PDF with no booking behind it, because that returns nothing when checked.',
    },
    {
      question: 'Is this accepted for a Schengen or UK visa application?',
      answer: 'Yes. Those applications ask for a flight reservation among the supporting documents rather than a purchased ticket, which is exactly what this is. Match the dates to the trip you describe in the rest of the file.',
    },
    {
      question: 'Can I use it for a visa on arrival country?',
      answer: 'Often that is where it matters most, because the airline checks before you fly rather than the destination checking after you land. Make sure the reservation stays live through your departure date.',
    },
    {
      question: 'How long should I make it valid?',
      answer: 'For a check-in desk, 2 days is usually enough. For a visa centre, 7 days is the safer choice, and 14 days covers an embassy that holds files for a week or more before opening them.',
    },
  ];

  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: `Dummy Ticket Philippines from ${from}`,
      description: `Verifiable flight reservations for the Philippines, priced in pesos from ${from}.`,
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in the Philippines',
      description: `Verifiable flight reservations priced in pesos from ${from}.`,
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket for Travellers in the Philippines',
      description: `Unticketed flight reservation with a verifiable PNR, priced in pesos from ${from}.`,
      price: String(p['2 Days']),
      currency: 'PHP',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: `Dummy tickets for travellers in the Philippines from ${from}.`,
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
        title={`Dummy Tickets in the Philippines from ${from}`}
        subtitle={`A dummy ticket is a real flight reservation with a verifiable PNR on Amadeus, Sabre or Travelport. Filipino travellers are asked for proof of onward travel more often than most, and this is the document that answers it. Priced and charged in pesos from ${from}, emailed within minutes.`}
        form={<AllForms forms={['ticket']} />}
        pills={[
          `From ${from}, charged in pesos`,
          'Valid 6-digit PNR',
          'Accepted at airline check-in',
          'Delivered in minutes',
        ]}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={tiersFrom(p, php)} />
      <Process
        title="Get Your Dummy Ticket in 3 Simple Steps"
        subtitle="Enter your route and dates, choose how long the booking stays live, and pay in pesos. The PDF arrives by email."
      />
      <About
        title="About Us"
        text="We are an international travel documentation provider issuing verifiable flight reservations for travellers worldwide, and Filipino travellers are among the groups we serve most. You can expect:"
        services={[
          {
            icon: <MdOutlineAirplaneTicket />,
            title: 'Dummy Tickets',
            description: `Verifiable flight reservations with a real PNR, accepted by airline staff and consulates. Priced in pesos from ${from}.`,
          },
          {
            icon: <MdOutlineHealthAndSafety />,
            title: 'Travel Insurance',
            description: `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Arranged on request, so email your trip details to ${EMAIL}.`,
          },
        ]}
      />
      <Benefits
        title="Why Filipino Travellers Book With Dummy Ticket 365"
        subtitle="Peso pricing, a booking that stands up at the counter, and no overnight wait"
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
            anchor: 'Onward ticket for airline check-in',
            href: '/onward-ticket',
            blurb: 'Proof of onward travel in three validity tiers.',
          },
          {
            anchor: 'Dummy ticket for a Schengen visa',
            href: '/dummy-ticket-schengen-visa',
            blurb: 'EU Visa Code Article 14 compliant, accepted at VFS, BLS and TLScontact.',
          },
          {
            anchor: 'Verifiable dummy ticket',
            href: '/verifiable-dummy-ticket',
            blurb: 'How an agent retrieves the record, and what a generated PDF fails on.',
          },
          {
            anchor: 'Dummy ticket for any visa application',
            href: '/dummy-ticket-for-visa',
            blurb: 'What each visa type asks for, and which accept a reservation.',
          },
        ]}
      />
      <Contact whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
