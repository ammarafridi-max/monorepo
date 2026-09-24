import { EMAIL } from '@/config/contact';
import { buildMetadata } from '@/lib/schema';
import {
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildProduct,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaFileAlt,
  FaHeadset,
  FaMoneyBillWave,
  FaShieldAlt,
} from 'react-icons/fa';
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import PricingTiers from '@/components/PricingTiers';
import BookCta from '@/components/BookCta';
import StickyBookingBar from '@travel-suite/frontend-shared/components/ui/v1/StickyBookingBar';
import { processSteps } from '@/data/processSteps';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';

export const benefits = [
  {
    title: 'Verifiable PNRs',
    text: 'The booking is real and the PNR is live, so it turns up in Amadeus, Sabre and Travelport where consulates and agents look. A few airlines will also show it under Manage Booking, though many never display an unpaid hold publicly. Check the GDS and you will always get an answer.',
    icon: FaCheckCircle,
  },
  {
    title: 'Laid out the way officers read it',
    text: 'Clean route, sensible timings, passenger details and PNR in the places a visa officer scans first. Nobody has to interpret anything, which is usually the difference between a question and no question.',
    icon: FaFileAlt,
  },
  {
    title: 'From AED 49',
    text: 'Take the reservation on its own, or add a hotel booking and insurance and hand in the whole file at once. The starting price is AED 49 and the reservation is no less genuine for it.',
    icon: FaMoneyBillWave,
  },
  {
    title: 'Nothing to lose if it goes wrong',
    text: 'A paid Schengen return can run into thousands of dirhams, and a refusal leaves you arguing with an airline about a refund. Here you are paying for the reservation, so a no costs you AED 49.',
    icon: FaShieldAlt,
  },
  {
    title: 'Quick, and someone is there',
    text: 'The reservation arrives within minutes and hotel bookings follow shortly after. If a visa centre queries something, email us and a UAE based human replies.',
    icon: FaHeadset,
  },
  {
    title: 'Validity you choose',
    text: 'Two days at AED 49, seven at AED 69, fourteen at AED 79. Match it to your appointment and any wait for a decision, because that is what the price tracks.',
    icon: FaCalendarAlt,
  },
];

export const faqs = [
  {
    question: 'Does a Schengen application have to include a flight reservation?',
    answer:
      'Yes. Article 14 of the EU Visa Code lists evidence of your transport arrangements among the supporting documents, and every Schengen consulate applies it. Note the wording: arrangements, not a purchased fare. A reservation covering your outbound and return legs satisfies it.',
  },
  {
    question: 'Will a dummy ticket work for a Schengen visa?',
    answer:
      'Yes, provided it is an actual reservation with a PNR someone can look up. That is the line that matters. A PDF made to look like a booking is not the same thing and is the reason people run into trouble.',
  },
  {
    question: 'Do I need to buy an actual flight ticket for a Schengen visa?',
    answer:
      'No, and consulates do not expect you to. Buying a non-refundable fare before a decision is a risk nobody asks you to take, which is exactly why the rules speak about arrangements rather than tickets.',
  },
  {
    question: 'How long is your dummy ticket valid for a Schengen visa?',
    answer:
      'Two, seven or fourteen days, at AED 49, AED 69 and AED 79. Pick the window that still covers you if the consulate takes a few days over your file.',
  },
  {
    question: 'When should I order a dummy ticket for my Schengen visa appointment?',
    answer:
      'One to three days ahead is the sweet spot: recent enough to still be live when someone checks it, early enough that you are not doing this the morning of. If your appointment is today, order now and it still arrives in minutes.',
  },
  {
    question: 'Do you offer refunds if my Schengen visa is rejected?',
    answer:
      'One case, clearly: if the refusal letter points at the flight reservation being expired or unverifiable, send it to us and we refund in full. Refusals on other grounds, and changes of heart, are not covered. A moved appointment just means we reissue with new dates for free.',
  },
];

const keyword = 'dummy ticket';

export const pageData = {
  meta: {
    title: 'Dummy Ticket for Schengen Visa From AED 49 | Accepted by VFS',
    description:
      'A genuine Schengen flight reservation with a PNR your consulate can verify. From AED 49, emailed in minutes, handled daily at VFS and BLS in Dubai and Abu Dhabi.',
    canonical: 'https://www.thedummyticket.ae/dummy-ticket-schengen-visa',
    entityName: 'Dummy Ticket for Schengen Visa',
  },
  sections: {
    hero: {
      title: 'The flight reservation your Schengen file is missing.',
      subtitle:
        'Article 14 of the EU Visa Code asks for evidence of your transport arrangements. It does not ask you to buy a ticket. We hold a real seat under a live PNR, you verify it yourself, and it goes into your file at VFS, BLS or the consulate. From AED 49, in your inbox within minutes.',
      form: <AllForms />,
    },
    process: {
      title: 'How Do You Book a Dummy Ticket for a Schengen Visa?',
      subtitle:
        'Three steps, and the longest part is deciding on your dates',
      keyword,
    },
    about: {
      title: 'About Us',
      text: (
        <>
          Article 14 of the{' '}
        <a
          href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32009R0810"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-900"
        >
          EU Visa Code
        </a>{' '}
          sets out what a Schengen file has to contain, and evidence of transport is
          on the list. Read it closely and you will see it asks how you plan to
          travel, not for a receipt. A reservation under a live PNR answers that,
          which is why consulates in the UAE see thousands of them a week.
        </>
      ),
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Dummy Tickets for Schengen Visa',
          description:
            'A real held seat with a PNR that VFS Global, BLS International and the consulates can check for themselves. From AED 49 per traveller.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Schengen Travel Insurance',
          description:
            'Schengen also wants EUR 30,000 of medical cover, and that one is not negotiable. Genuine AXA policies, issued on the spot, on their own or alongside the reservation.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'The other document that gets asked for. Send us your cities and dates and we prepare the accommodation proof to match.',
        },
      ],
    },
    benefits: {
      title: 'What You Get for AED 49',
      subtitle: 'The things that actually matter when a consulate opens your file',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'What Schengen consulates ask for, and what they do not',
      faqs,
    },
    contact: {
      title: 'Not Sure Which You Need?',
      subtitle: 'Ask before you book',
      text: 'If you are weighing a reservation against buying the fare outright, tell us your appointment date and route and we will give you a straight answer, even when it is that you do not need us.',
    },
  },
};

export const metadata = buildMetadata(pageData.meta);

export default function Page() {
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(pageData.meta),
    buildService({
      canonical: pageData.meta.canonical,
      name: pageData.meta.entityName,
      description: pageData.meta.description,
      areaServed: 'AE',
    }),
    buildProduct({
      canonical: pageData.meta.canonical,
      name: pageData.meta.entityName,
      description: pageData.meta.description,
      price: '49.00',
      currency: 'AED',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: pageData.sections.faqs.title,
      description: pageData.meta.description,
      faqs: pageData.sections.faqs.faqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />

      <Hero
        title={pageData.sections.hero.title}
        subtitle={pageData.sections.hero.subtitle}
        form={pageData.sections.hero.form}
        pills={[
          'Accepted by VFS & BLS',
          'Verifiable PNR Code',
          'Schengen Visa Compliant',
          'Starts from AED 49',
        ]}
        breadcrumbPaths={[
          { label: 'Home', href: '/' },
          { label: 'Dummy Ticket for Schengen Visa' },
        ]}
      />

      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={processSteps}
      />

      <PricingTiers
        title="How Much Does a Schengen Visa Dummy Ticket Cost?"
        keyword="Schengen visa dummy ticket"
      />

      <About
        title={pageData.sections.about.title}
        text={pageData.sections.about.text}
        services={pageData.sections.about.services}
      />

      <Benefits
        title={pageData.sections.benefits.title}
        subtitle={pageData.sections.benefits.subtitle}
        benefits={pageData.sections.benefits.benefits}
      />

      <FAQ
        title={pageData.sections.faqs.title}
        subtitle={pageData.sections.faqs.subtitle}
        faqs={pageData.sections.faqs.faqs}
      />
      <BookCta className="pb-16 md:pb-20 px-6" />

      <Contact
        email={EMAIL}
        replyTime="within 10 to 15 minutes, 24/7"
        title={pageData.sections.contact.title}
        subtitle={pageData.sections.contact.subtitle}
        text={pageData.sections.contact.text}
      />
      <StickyBookingBar label="Book now" />
    </>
  );
}
