import { EMAIL, WHATSAPP_NUMBER } from '@/config/contact';
import { testimonials } from '@/data/testimonials';
import QuickAnswer from '@/components/QuickAnswer';
import { getUsdPrices, usdTiers } from '@/lib/tiers';
import RelatedPages from '@/components/RelatedPages';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import {
  HiCalendarDays,
  HiCheckBadge,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
  HiArrowPath,
} from 'react-icons/hi2';

const CANONICAL = `${SITE_URL}/dummy-ticket-14-days`;

const QUESTION = 'How long is a 14 day dummy ticket valid?';
const ANSWER =
  'A 14 day dummy ticket keeps its PNR live on the GDS for fourteen days from the moment it is delivered, which is the longest tier we issue, and it costs USD 21. Validity runs from delivery rather than from the date you ordered, so if you need the booking to still be live when a slow consulate finally opens your file, this is the tier that covers it.';

export const metadata = {
  title: 'Dummy Ticket Valid for 14 Days, USD 21 | Longest Tier',
  description:
    'A dummy ticket with 14 days validity for USD 21. The PNR stays live on Amadeus, Sabre or Travelport for a full fortnight from delivery. Emailed in minutes.',
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true },
  openGraph: {
    url: CANONICAL,
    title: 'Dummy Ticket Valid for 14 Days, USD 21 | Longest Tier',
    description: 'Fourteen days of live PNR validity for USD 21, delivered by email in minutes.',
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: { card: 'summary_large_image', images: [`${SITE_URL}/og-image.png`] },
};

const benefits = [
  {
    title: 'Fourteen Days, Counted From Delivery',
    text: 'The clock starts when the ticket reaches your inbox, not when you paid. If you schedule delivery for a later date, the fortnight starts then, which lets you line the window up with your appointment.',
    icon: HiCalendarDays,
  },
  {
    title: 'Built for Consulates That Take Their Time',
    text: 'Two days is enough when someone checks your file at the counter. It is not enough when a consulate holds the application for a week and a half before anyone opens it. This tier is for that case.',
    icon: HiOutlineClock,
  },
  {
    title: 'USD 21, All In',
    text: 'The three tiers are USD 13 for 2 days, USD 19 for 7 days and USD 21 for 14 days. The reservation itself is identical in each; you are paying for how long it stays live, not for a better booking.',
    icon: HiOutlineCurrencyDollar,
  },
  {
    title: 'Same Verifiable PNR',
    text: 'The 14 day tier is a real GDS reservation on Amadeus, Sabre or Travelport with a six-character PNR, exactly like the shorter tiers. Longer validity does not mean a different kind of document.',
    icon: HiShieldCheck,
  },
  {
    title: 'Covers a Resubmission',
    text: 'If a visa centre asks for a corrected document, a fortnight of validity usually means you still have a live booking to point at rather than buying a second reservation a few days later.',
    icon: HiArrowPath,
  },
  {
    title: 'Not Longer Than Your Flight',
    text: 'We will not sell you fourteen days of validity for a flight that leaves in three, because that is validity you cannot use. If your departure is closer than the tier you pick, the form says so.',
    icon: HiCheckBadge,
  },
];

const faqs = [
  { question: QUESTION, answer: ANSWER },
  {
    question: 'Can I get a dummy ticket valid longer than 14 days?',
    answer:
      'Fourteen days is the longest tier we issue. Unticketed GDS reservations are not designed to be held open indefinitely, and a booking stretched much further tends to lapse on its own. If your window is longer than a fortnight, the usual answer is to time delivery rather than extend validity.',
  },
  {
    question: 'Which validity should I choose?',
    answer:
      'Match the tier to the gap between handing in your file and someone opening it. Pick 2 days for an airline check-in desk or a same-day appointment, 7 days for a typical visa centre turnaround, and 14 days when the consulate is slow or you are submitting well ahead of a decision.',
  },
  {
    question: 'Does the 14 day ticket cost more because it is better?',
    answer:
      'No. The reservation is the same on all three tiers. The price difference reflects how long the booking is held live on the GDS, which is the only thing that changes.',
  },
  {
    question: 'When exactly does validity start?',
    answer:
      'On delivery. Choose immediate delivery and it starts the same day. Choose a later date and it starts on that date, which is usually the better move if your appointment is still a while away.',
  },
  {
    question: 'What happens after the 14 days are up?',
    answer:
      'The booking lapses and the PNR stops resolving, so anyone checking it after that sees nothing. That is why the tier needs to cover the day someone actually looks, not just the day you submit.',
  },
  {
    question: 'Can I pay in my own currency?',
    answer:
      'Yes, in several. Prices are set per currency rather than converted at checkout, so the figure you see is the figure you are charged. There are rupee, dirham, pound, Canadian dollar and riyal price books alongside the US dollar one.',
  },
];


export default async function Page() {
  const usdPrices = await getUsdPrices();
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: CANONICAL,
      title: 'Dummy Ticket Valid for 14 Days',
      description: 'Fourteen days of live PNR validity for USD 21.',
    }),
    buildService({
      canonical: CANONICAL,
      name: 'Dummy Ticket with 14 Days Validity',
      description: 'Flight reservation held live on the GDS for fourteen days from delivery.',
    }),
    buildProduct({
      canonical: CANONICAL,
      name: 'Dummy Ticket with 14 Days Validity',
      description:
        'Unticketed flight reservation with a verifiable PNR, held live for fourteen days from delivery.',
      price: String(usdPrices['14 Days']),
      currency: 'USD',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Frequently Asked Questions',
      description: 'How 14 day dummy ticket validity works.',
      faqs,
    }),
    buildBreadcrumbList({
      paths: [
        { label: 'Home', href: '/' },
        { label: 'Dummy Ticket Valid for 14 Days' },
      ],
    }),
  ]);
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Dummy Ticket Valid for 14 Days' },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Hero
        title="Dummy Tickets Valid for 14 Days, USD 21"
        subtitle="Fourteen days is our longest validity tier. The PNR sits live on Amadeus, Sabre or Travelport for a full fortnight from the day the ticket is delivered, which is what you want when a consulate is going to hold your file for a week and a half before anyone looks at it."
        form={<AllForms forms={['ticket']} />}
        pills={[
          '14 days live validity',
          'USD 21 per person',
          'Verifiable GDS PNR',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />
      <QuickAnswer question={QUESTION} answer={ANSWER} tiers={usdTiers(usdPrices)} />
      <Process
        title="How to Book a 14 Day Dummy Ticket"
        subtitle="Enter your route and dates, pick the 14 day validity, and choose whether to receive it now or closer to your appointment."
      />
      <Benefits
        title="Why Choose the 14 Day Tier"
        subtitle="What the longest validity window is actually for"
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
        title="Related Dummy Ticket Pages"
        subtitle="Other options and use cases"
        links={[
          {
            anchor: 'Verifiable dummy ticket',
            href: '/verifiable-dummy-ticket',
            blurb: 'How a consulate checks a PNR, and what a fake fails on.',
          },
          {
            anchor: 'Dummy ticket for a visa application',
            href: '/dummy-ticket-for-visa',
            blurb: 'What consulates ask for, by visa type.',
          },
          {
            anchor: 'Multi city dummy ticket',
            href: '/multi-city-dummy-ticket',
            blurb: 'Several legs under one PNR for multi-country trips.',
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
