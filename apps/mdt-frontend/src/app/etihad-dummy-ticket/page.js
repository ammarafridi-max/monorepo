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
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaMoneyBillWave,
  FaUserTie,
} from 'react-icons/fa';
import Hero from '@travel-suite/frontend-shared/components/v1/sections/Hero';
import AllForms from '@travel-suite/frontend-shared/components/v1/forms/AllForms';

const Process = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Process'));
const About = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/About'));
const Benefits = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Benefits'));
const FAQ = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/FAQ'));
const Contact = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Contact'));
const BlogPosts = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/BlogPosts'));

export const benefits = [
  {
    title: 'Real Etihad PNR for Verification',
    text: "Every booking includes a live 6-character PNR verifiable on Etihad's Manage My Booking page — the same system consular officers use. Your reservation looks identical to a paid ticket.",
    icon: FaCheckCircle,
  },
  {
    title: 'Pay Only AED 49',
    text: 'A flexible Etihad ticket can cost over AED 2,500 for a single route. Our verified reservation costs just AED 49. You can fulfill the same visa requirements for less than 2% of the price.',
    icon: FaMoneyBillWave,
  },
  {
    title: 'Extended Validity',
    text: 'Our reservations stay active for 7 or 14 days — far longer than the 24–72 hour holds airlines offer. This comfortably covers standard visa processing timelines.',
    icon: FaClock,
  },
  {
    title: 'Visa-Friendly Formatting',
    text: 'Every itinerary follows the exact layout visa officers expect at VFS, BLS, and embassy counters. All required flight and passenger details are included, correctly formatted.',
    icon: FaFileAlt,
  },
  {
    title: 'Fast Delivery',
    text: 'Our automated system delivers your Etihad itinerary to your inbox within 10–15 minutes, 24/7. No waiting for business hours, no manual processing.',
    icon: FaBolt,
  },
  {
    title: 'Direct Support from a Specialist',
    text: 'Our visa documentation specialists respond within 2 hours. Need a confirmation letter, travel date change, or embassy-specific query? We handle it — faster than airline support.',
    icon: FaUserTie,
  },
];

export const pageData = {
  meta: {
    title: 'Etihad Dummy Ticket From AED 49 | Verifiable PNR for Visa',
    description:
      'Get an official Etihad Airways dummy ticket with a live, verifiable PNR for visa applications. Accepted by embassies and visa centers. Starting from AED 49.',
    canonical: 'https://www.mydummyticket.ae/etihad-dummy-ticket',
  },
  sections: {
    hero: {
      title: 'Etihad Dummy Ticket From AED 49. Verified & Fast.',
      subtitle:
        'Get an official Etihad Airways flight reservation with a live booking reference for your visa application. Our Etihad dummy tickets provide a real, verifiable flight reservation with a valid PNR that shows your travel intent, without the financial commitment.',
      form: <AllForms />,
    },
    process: {
      title: 'How Our Etihad Dummy Ticket Service Works',
      subtitle:
        'We follow a simple 3-step process to guarantee an approved Etihad flight reservation that meets your visa application requirements.',
    },
    about: {
      title: 'About Us',
      text: "We've been issuing verified flight reservations for visa applications since 2008 — over 16 years of specialist experience. Every year, we issue 10,000+ dummy tickets to UAE residents and GCC citizens applying for Schengen, US, UK, Canadian, and other visas. Our Etihad reservations include a live PNR verifiable on Etihad's Manage My Booking system — the same system used by VFS, BLS, and consular officers to confirm reservations. Our documentation is accepted by embassies worldwide.",
    },
    benefits: {
      title: 'Why Choose My Dummy Ticket for Etihad Flight Proof?',
      subtitle:
        'Buying a real Etihad Airways ticket before visa approval is quite risky financially. My Dummy Ticket provides verifiable, Etihad itineraries that keep your application strong.',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: '',
      faqs: [
        {
          question:
            'Is an Etihad dummy ticket valid for a Schengen or UK visa?',
          answer:
            "Yes. Our Etihad dummy tickets fulfill the proof of booked flight requirement for Schengen, UK, US B1/B2, and Canadian TRV applications. Every reservation includes a live PNR verifiable on Etihad's Manage My Booking — the same reference visa officers check.",
        },
        {
          question: 'What if the embassy asks for a paid receipt or ticket?',
          answer:
            'Embassies require proof of a concrete travel plan, not proof of payment. Our Etihad reservations display exactly like paid bookings — with a valid PNR, passenger name, route, and travel dates — giving visa officers everything they need.',
        },
        {
          question:
            "What's the difference between your service and booking directly with Etihad?",
          answer:
            'A flexible Etihad ticket costs AED 2,500 or more and ties up your money before visa approval. Our verified reservation costs AED 49 — same verifiable PNR, zero financial risk if your visa is denied.',
        },
        {
          question: 'Do you offer refunds if my visa is denied?',
          answer:
            'We do not offer refunds once the ticket has been delivered. However, if your appointment is delayed, we can re-issue your reservation with updated dates and a fresh PNR — at no extra charge.',
        },
        {
          question: 'How long is the Etihad dummy ticket valid for?',
          answer:
            'Our reservations stay active for 7 or 14 days from issue — significantly longer than the 24–72 hour holds airlines offer. This comfortably covers Schengen, UK, US, and Canadian visa processing timelines.',
        },
      ],
    },
    contact: {
      title: 'Book Your Etihad Dummy Ticket Confidently',
      subtitle: '',
      text: 'Don’t risk your visa submission with incomplete travel evidence or overpay for a flight you might not use. Get your embassy-ready, verifiable Etihad dummy ticket today at My Dummy Ticket.',
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
        <About
          title={pageData.sections.about.title}
          text={pageData.sections.about.text}
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
        <BlogPosts />
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
