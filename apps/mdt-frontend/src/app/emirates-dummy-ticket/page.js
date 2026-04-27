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
  FaGlobe,
  FaHandsHelping,
  FaMoneyBillWave,
  FaSearch,
} from 'react-icons/fa';
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';
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
    title: '100% Embassy Accepted',
    text: 'Our itineraries follow professional formats that meet all official requirements of embassies, consulates, and visa centers like VFS, BLS, TLScontact. We keep your file organized and guarantee acceptance for submission.',
    icon: FaCheckCircle,
  },
  {
    title: 'Verifiable PNRs',
    text: 'Our dummy ticket comes with a live 6-digit PNR. You and your visa officer can check the PNR directly on the airline’s official website. Plus, the tickets do not expire within 24 hours, but the validity depends on the availability you select.',
    icon: FaSearch,
  },
  {
    title: 'Affordable Alternative',
    text: 'Emirates fares are quite expensive. So, instead of paying hundreds or thousands upfront, our dummy tickets start from budget-friendly pricing, and this gives you valid travel proof without committing to a full airfare.',
    icon: FaMoneyBillWave,
  },
  {
    title: 'Flexible Support',
    text: 'For inconsistent visa appointments and travel timelines, our Emirates dummy tickets allow for adjustments if dates or routes need to be upgraded. This helps you keep your application consistent without extra cost.',
    icon: FaHandsHelping,
  },
  {
    title: 'Fast Delivery',
    text: 'We deliver your visa application dummy tickets quickly as a professional PDF via email. Our support team is responsive and available to help with verification, updates, or questions before and after delivery.',
    icon: FaBolt,
  },
  {
    title: 'Widely Used for Multiple Visa Types',
    text: 'We offer a versatile and practical choice for different travel purposes. Applicants get our dummy tickets for Emirates confidently for Schengen visas, US visas, UK visas, Canadian visas, and other embassy applications.',
    icon: FaGlobe,
  },
];

const keyword = 'Emirates dummy ticket';

export const pageData = {
  meta: {
    title: 'Emirates Dummy Ticket From AED 49 | Verifiable PNR | Accepted by VFS',
    description:
      'Get an official Emirates flight reservation with a live 6-digit PNR for your visa application in minutes. Accepted by VFS, BLS, and consulates. Just AED 49.',
    canonical: 'https://www.mydummyticket.ae/emirates-dummy-ticket',
  },
  sections: {
    hero: {
      title: 'Emirates Dummy Ticket for Visa Applications',
      subtitle:
        "Get an official Emirates flight reservation with a live 6-digit PNR for your visa application in minutes. Our dummy ticket is verifiable on the Emirates website under 'Manage Booking' and is accepted by VFS, BLS, and consulates as valid proof of travel intent, all for just AED 49.",
      form: <AllForms />,
    },
    process: {
      title: 'How to Book Your Emirates Dummy Ticket in 3 Steps',
      subtitle: 'Our entire process is safe, fast, and reliable.',
      keyword,
    },
    about: {
      title: 'About Us',
      text: 'We are a licensed travel agency based in Dubai, UAE. We offer air tickets, hotel bookings, travel insurance, flight and hotel reservations, airport transfers, tours, and holiday packages to thousands of satisfied customers annually. Our documentation is accepted by VFS, BLS, and embassies.',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Emirates Dummy Tickets',
          description:
            'Genuine Emirates flight reservations with a verifiable PNR, accepted by VFS, BLS, and embassies worldwide. Issued through official airline systems and delivered from AED 49.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'AXA-backed travel insurance for UAE residents. Schengen-compliant plans available if you\'re applying for a European visa alongside your Emirates dummy ticket.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'We provide hotel reservations by email, formatted to meet embassy requirements. Available alongside your Emirates dummy ticket to complete your visa application.',
        },
      ],
    },
    benefits: {
      title: 'Why Choose Us To Buy Emirates Dummy Tickets?',
      subtitle:
        'To get an Emirates dummy ticket, My Dummy Ticket is a perfect choice. We provide real, embassy-ready flight reservations that look professional, verify correctly, and support your visa file without financial risk.',
      benefits,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: '',
      faqs: [
        {
          question: 'Can I verify an Emirates dummy ticket online?',
          answer:
            'Yes. Every Emirates dummy ticket we provide comes with a valid PNR that you or the visa officer can verify directly on the Emirates website under the Manage Booking section.',
        },
        {
          question: 'Is an Emirates dummy ticket accepted for visa applications?',
          answer:
            'Applicants widely use Emirates dummy tickets as travel proof for Schengen, US, UK, Canada, and other visas, as embassies commonly request and review verifiable flight itineraries.',
        },
        {
          question: 'Do I need to buy a real Emirates ticket for my visa?',
          answer:
            'No. Buying a real ticket before visa approval is risky and expensive. A dummy ticket allows you to show your intended travel plan without paying for a full airfare upfront.',
        },
        {
          question: 'How long is the Emirates dummy ticket valid?',
          answer:
            'The usual validity period for a dummy ticket for Emirates is 24 to 72 hours. It is sufficient for visa submission and embassy review. We recommend submitting your application soon after receiving the ticket.',
        },
      ],
    },
    contact: {
      title: 'Ready to Apply for Your Visa with Emirates Travel Proof?',
      subtitle: '',
      text: 'Contact us today to facilitate your visa application with a verified Emirates dummy ticket. Get a professional, embassy-ready itinerary quickly, save on airfare, and submit your travel proof with confidence.',
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
        <About title={pageData.sections.about.title} services={pageData.sections.about.services} />
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
