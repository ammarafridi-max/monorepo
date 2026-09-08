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
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import PricingTiers from '@/components/PricingTiers';
import { processSteps } from '@/data/processSteps';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';

export const benefits = [
  {
    title: '100% Embassy Accepted',
    text: 'Our itineraries follow professional formats that meet all official requirements of embassies, consulates, and visa centers like VFS, BLS, TLScontact. We keep your file organized and guarantee acceptance for submission.',
    icon: FaCheckCircle,
  },
  {
    title: 'Verifiable PNRs',
    text: 'Our dummy ticket comes with a live 6-digit PNR. You and your visa officer can check it on the Emirates website under Manage Booking, and through the global distribution systems (Amadeus, Sabre, Travelport) that embassies use. Validity follows the period you select: 2 days at AED 49, 7 days at AED 69, or 14 days at AED 79.',
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
    title: 'Emirates Dummy Ticket AED 49 | Verify on Emirates.com',
    description:
      'Real Emirates reservation with a live 6-character PNR, checkable on Emirates.com under Manage Booking. Accepted by VFS and BLS. From AED 49, sent in minutes.',
    canonical: 'https://www.mydummyticket.ae/emirates-dummy-ticket',
    entityName: 'Emirates Dummy Ticket',
  },
  sections: {
    hero: {
      title: 'Emirates Dummy Ticket for Visa Applications',
      subtitle:
        "An Emirates dummy ticket is a real Emirates reservation with a live 6-character PNR, not a paid ticket. Emirates is one of the airlines that shows it under Manage Booking, and it is also verifiable on the global GDS embassies use. Use it for visas, check-in and immigration. From AED 49.",
      form: <AllForms />,
    },
    process: {
      title: 'How Do You Book an Emirates Dummy Ticket?',
      subtitle: 'Our entire process is safe, fast, and reliable.',
      keyword,
    },
    about: {
      title: 'About Us',
      text: (
        <>
          We are a licensed travel agency based in Dubai. Every reservation we issue carries a live 6-character PNR you can check on the Emirates{' '}<a href="https://www.emirates.com/ae/english/manage-booking/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gray-900">Manage Booking</a>{' '}page, and through the global GDS platforms embassies use.
        </>
      ),
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
            'You choose the validity period: 2 days at AED 49, 7 days at AED 69, or 14 days at AED 79. Pick the one that covers your appointment date and the embassy review window.',
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
          'Real Emirates PNR',
          'Verifiable on Emirates.com',
          'Accepted by Embassies Worldwide',
          'Starts from AED 49',
        ]}
        breadcrumbPaths={[
          { label: 'Home', href: '/' },
          { label: 'Emirates Dummy Ticket' },
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={processSteps}
      />

      <PricingTiers
        title="How Much Does an Emirates Dummy Ticket Cost?"
        keyword="Emirates dummy ticket"
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
      <BlogPosts />
      <Contact
        email={EMAIL}
        title={pageData.sections.contact.title}
        subtitle={pageData.sections.contact.subtitle}
        text={pageData.sections.contact.text}
      />
    </>
  );
}
