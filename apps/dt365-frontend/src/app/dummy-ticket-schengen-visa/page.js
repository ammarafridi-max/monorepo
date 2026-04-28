import { lazy, Suspense } from 'react';
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
  HiOutlineCheckBadge,
  HiOutlineBanknotes,
  HiOutlineGlobeAlt,
  HiOutlineArrowsRightLeft,
  HiOutlineClock,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineLuggage } from 'react-icons/md';
import Hero from '@travel-suite/frontend-shared/components/v1/sections/Hero';
import AllForms from '@travel-suite/frontend-shared/components/v1/forms/AllForms';

const Process = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Process'));
const About = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/About'));
const Benefits = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Benefits'));
const FAQ = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/FAQ'));
const Contact = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Contact'));

const benefits = [
  {
    title: 'Authentic Reservation Structure',
    text: 'Each flight reservation includes a real, checkable booking reference (PNR) generated through recognized reservation systems. During validity, embassies or visa centers can perform routine checks using this PNR.',
    icon: HiOutlineCheckBadge,
  },
  {
    title: 'Cost-Effective Starting at Just $13',
    text: 'Our dummy tickets start from $13, allowing applicants to meet embassy requirements without purchasing a full-priced, non-refundable airline ticket.',
    icon: HiOutlineBanknotes,
  },
  {
    title: 'Wide Acceptance',
    text: 'You can apply through France, Germany, Italy, or any Schengen country, as our ticket format is suitable across all Schengen consulates worldwide.',
    icon: HiOutlineGlobeAlt,
  },
  {
    title: 'Flexible Support',
    text: 'Visa processing times vary and travel plans change. Our service lets you submit a compliant itinerary now and finalize your actual booking later.',
    icon: HiOutlineArrowsRightLeft,
  },
  {
    title: 'Timely Delivery',
    text: 'Visa appointments may be scheduled early but require updated documents closer to submission. We deliver your Schengen itinerary promptly to meet deadlines.',
    icon: HiOutlineClock,
  },
  {
    title: 'Selectable Validity',
    text: 'Choose a dummy ticket validity that fits your needs, such as 48 hours, 7 days, or 14 days, keeping your reservation relevant during review.',
    icon: HiOutlineCalendarDays,
  },
];

const faqs = [
  {
    question: 'Is a dummy ticket acceptable for Schengen visa applications?',
    answer:
      'Many Schengen embassies and visa centers request a flight reservation rather than a paid ticket at the application stage. Our dummy tickets are created in a visa-friendly format commonly used for Schengen visa submissions. Final acceptance always depends on the embassy or consulate.',
  },
  {
    question: 'Does the flight reservation include a verifiable PNR?',
    answer:
      'Yes. Each flight reservation for a Schengen visa issued by DummyTicket365 includes a booking reference (PNR) that can be checked online for its selected validity period.',
  },
  {
    question: 'How long is the dummy ticket valid?',
    answer:
      'You can choose from 48 hours, 7 days, or 14 days of validity at the time of booking. This allows you to match the reservation validity with your visa appointment or document submission timeline.',
  },
  {
    question: 'How much does a dummy ticket cost?',
    answer:
      'The cost starts from $13, depending on the selected validity period and itinerary type. This makes it a cost-effective alternative to purchasing a full airline ticket before visa approval.',
  },
  {
    question: 'Can I use this reservation as an onward or return ticket?',
    answer:
      'Yes, you can use our dummy ticket for an onward ticket for a Schengen visa or as a return flight reservation, depending on your travel route and visa application requirements.',
  },
];

const pageData = {
  meta: {
    title: 'Dummy Ticket for Schengen Visa From $13 | Verifiable PNR',
    description:
      'Secure a dummy ticket for Schengen visa applications with a verifiable PNR, accepted for visa submissions. Budget-friendly pricing from $13.',
    canonical: 'https://www.dummyticket365.com/dummy-ticket-schengen-visa',
  },
  sections: {
    hero: {
      title: 'Book Your Dummy Ticket For Schengen Visa From $13',
      subtitle:
        'Secure a dummy ticket for Schengen visa applications with a verifiable PNR, without buying an expensive flight. Widely used for embassy, VFS, and BLS submissions, and trusted worldwide for clear, credible travel plans.',
      form: <AllForms forms={['ticket']} />,
    },
    process: {
      title: 'How to Book Your Dummy Flight Ticket for a Schengen Visa?',
      subtitle:
        'Here are three clear steps that can help you get a smooth visa flight reservation:',
    },
    about: {
      title: 'About DummyTicket365 Services',
      text: 'DummyTicket365 is an international travel documentation service supporting visa applicants worldwide. We provide visa-compliant travel documents that meet immigration requirements without forcing applicants to make irreversible travel purchases. Our services are used by travelers applying for Schengen, UK, US, Canadian, and other visas.',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Ticket for Schengen Visa",
          description: "Verifiable flight reservation with a real PNR, issued in the format required by Schengen embassies. Accepted by VFS Global and BLS International. From USD 13.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Schengen Travel Insurance",
          description: "Schengen visa applications require EUR 30,000 minimum medical coverage. We issue AXA-backed, embassy-compliant insurance instantly — bundle it with your dummy ticket.",
        },
        {
          icon: <MdOutlineLuggage />,
          title: "Onward Tickets",
          description: "Need proof of onward travel for immigration or airline check-in? Our onward tickets include a verifiable PNR and are accepted worldwide.",
        },
      ],
    },
    benefits: {
      title: 'Benefits of Our Dummy Ticket for Schengen Visa',
      subtitle:
        'We are a top international dummy ticket provider for the Schengen visas, and people choose us for the following reasons:',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about dummy tickets for Schengen visas',
      faqs,
    },
    contact: {
      title: 'Questions on our dummy tickets?',
      text: 'With DummyTicket365, you can secure a flight reservation for a Schengen visa that meets application requirements. Our service is available 24/7, and you can contact our support team anytime via email for assistance or document updates.',
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
      name: pageData.meta.title,
      description: pageData.meta.description,
      areaServed: 'AE',
    }),
    buildProduct({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      price: '13.00',
      currency: 'USD',
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
          'Dummy tickets from $13',
          'Verifiable PNR included',
          'Accepted by VFS and BLS',
          'Delivered in minutes',
        ]}
      />

      <Suspense fallback={null}>
        <Process
          title={pageData.sections.process.title}
          subtitle={pageData.sections.process.subtitle}
        />
      </Suspense>

      <Suspense fallback={null}>
        <About
          title={pageData.sections.about.title}
          text={pageData.sections.about.text}
          services={pageData.sections.about.services}
        />
      </Suspense>

      <Suspense fallback={null}>
        <Benefits
          title={pageData.sections.benefits.title}
          subtitle={pageData.sections.benefits.subtitle}
          benefits={pageData.sections.benefits.benefits}
        />
      </Suspense>

      <Suspense fallback={null}>
        <FAQ
          title={pageData.sections.faqs.title}
          subtitle={pageData.sections.faqs.subtitle}
          faqs={pageData.sections.faqs.faqs}
        />
      </Suspense>

      <Suspense fallback={null}>
        <Contact
          title={pageData.sections.contact.title}
          text={pageData.sections.contact.text}
        />
      </Suspense>
    </>
  );
}
