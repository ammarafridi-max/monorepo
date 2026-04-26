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
  FaCalendarAlt,
  FaCheckCircle,
  FaFileAlt,
  FaHeadset,
  FaMoneyBillWave,
  FaShieldAlt,
} from 'react-icons/fa';
import Hero from '@travel-suite/frontend-shared/components/v1/sections/Hero';
import AllForms from '@travel-suite/frontend-shared/components/v1/forms/AllForms';

const Process = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Process'));
const About = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/About'));
const Benefits = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Benefits'));
const FAQ = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/FAQ'));
const Contact = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Contact'));

export const benefits = [
  {
    title: 'Verifiable PNRs',
    text: "Our dummy tickets are genuine reservations with an active PNR code that can be verified on the airline's official website. This transparency builds trust and gives visa officers confidence in your documentation.",
    icon: FaCheckCircle,
  },
  {
    title: 'Visa-Friendly Formatting',
    text: 'Our itineraries follow professional formats with clean routes, accurate timing, passenger information, and layouts that align with officer expectations. This keeps your file organized and reduces questioning during appointments.',
    icon: FaFileAlt,
  },
  {
    title: 'Affordable Service',
    text: 'Our packages are affordable whether you choose a flight itinerary or a complete bundle with hotel booking and insurance. Prices start from AED 49, a cost-effective option in the UAE without compromising authenticity.',
    icon: FaMoneyBillWave,
  },
  {
    title: 'No Financial Risk',
    text: 'Buying a real ticket before visa approval can cost thousands, and if denied, you lose your money. With our dummy ticket, you avoid that risk entirely by paying only for the reservation service, not the actual flight.',
    icon: FaShieldAlt,
  },
  {
    title: 'Fast Delivery & Support',
    text: 'We deliver your flight reservation and optional hotel bookings quickly, often within minutes. Our UAE-based support team is responsive and ready to assist with verification or adjustments.',
    icon: FaHeadset,
  },
  {
    title: 'Flexible Validity Options',
    text: 'Choose validity periods that match your visa appointment schedule: 48 hours, 7 days, or 14 days, depending on the availability you select.',
    icon: FaCalendarAlt,
  },
];

export const faqs = [
  {
    question: 'Is it mandatory to show a flight reservation for a Schengen visa application?',
    answer:
      'Yes, most Schengen embassies and visa centers require a confirmed or reserved return flight itinerary as proof of onward and return travel when applying for a Schengen visa. A flight reservation helps visa officers assess your travel plan without requiring you to purchase a non-refundable ticket.',
  },
  {
    question: 'Will a dummy ticket work for a Schengen visa?',
    answer:
      'Yes. A dummy ticket for a Schengen visa is widely accepted when it is a genuine flight reservation with a verifiable PNR code. Embassies and visa centers such as VFS and BLS accept these reservations as valid proof of travel for visa applications.',
  },
  {
    question: 'Do I need to buy an actual flight ticket for a Schengen visa?',
    answer:
      'No, you do not need to buy a real flight ticket before your visa is approved. A dummy flight ticket or flight reservation allows you to submit embassy-ready travel proof while avoiding the financial risk of purchasing a non-refundable airfare.',
  },
  {
    question: 'How long is your dummy ticket valid for a Schengen visa?',
    answer:
      'Our dummy tickets for Schengen visa applications are available with flexible validity options of 48 hours, 7 days, or 14 days. This allows you to choose a validity period that matches your visa appointment and document submission timeline.',
  },
  {
    question: 'When should I order a dummy ticket for my Schengen visa appointment?',
    answer:
      'It is recommended to order your dummy ticket one to three days before your Schengen visa appointment so the reservation remains active during verification. For urgent or last-minute appointments, same-day express delivery is also available.',
  },
  {
    question: 'Do you offer refunds if my Schengen visa is rejected?',
    answer:
      'As dummy tickets are a document-preparation service, refunds are not offered after delivery. However, if any correction or update is required due to an error on our side, we will revise the reservation at no additional cost.',
  },
];

const keyword = 'dummy ticket';

export const pageData = {
  meta: {
    title: 'Dummy Ticket for Schengen Visa From AED 49 | Accepted by VFS',
    description:
      'Book your dummy flight ticket for Schengen visa. We provide verifiable dummy tickets with a valid PNR number that are accepted by VFS. Starting from AED 49.',
    canonical: 'https://www.mydummyticket.ae/dummy-ticket-schengen-visa',
  },
  sections: {
    hero: {
      title: 'Dummy Tickets For Schengen Visa',
      subtitle:
        'Book your verifiable dummy ticket for your Schengen visa from AED 49. Our dummy tickets come with a 6-digit PNR number that can be used to verify ticket details at airline and reservation systems, and they are accepted by VFS, BLS, and embassies for visa applications.',
      form: <AllForms />,
    },
    process: {
      title: 'How to book your dummy ticket?',
      subtitle:
        "Get your dummy ticket for Schengen visa in 3 quick, simple, and hassle-free steps. Here's how it works:",
      keyword,
    },
    about: {
      title: 'About Us',
      text: '',
      keyword,
    },
    benefits: {
      title: 'Benefits of Choosing Our Dummy Tickets for Your Schengen Visa',
      subtitle: 'This is why we believe you should book your dummy ticket with us',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Commonly asked questions about dummy tickets for Schengen visa',
      faqs,
    },
    contact: {
      title: 'Reserve Your Dummy Ticket with Us',
      subtitle: 'Contact us now',
      text: 'Still not sure whether you should book a dummy ticket or get a real flight ticket? Get in touch with us now and let us help you clear your doubts.',
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
      />

      <Suspense fallback={null}>
        <Process
          title={pageData.sections.process.title}
          subtitle={pageData.sections.process.subtitle}
        />
      </Suspense>

      <Suspense fallback={null}>
        <About title={pageData.sections.about.title} keyword={pageData.sections.about.keyword} />
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
          subtitle={pageData.sections.contact.subtitle}
          text={pageData.sections.contact.text}
        />
      </Suspense>
    </>
  );
}
