import AllForms from '@travel-suite/frontend-shared/components/v1/forms/AllForms';
import Hero from '@travel-suite/frontend-shared/components/v1/sections/Hero';
import Process from '@travel-suite/frontend-shared/components/v1/sections/Process';
import About from '@travel-suite/frontend-shared/components/v1/sections/About';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineLuggage } from 'react-icons/md';
import { buildMetadata } from '@/lib/schema';
import {
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

const pageData = {
  meta: {
    title: 'Travel Insurance - Instant Delivery',
    description:
      'Book outbound travel insurance from anywhere for your trip. Our travel insurance policies are genuine, legitimate, and accepted for various purposes, including embassies for visa applications.',
    canonical: 'https://www.dummyticket365.com/travel-insurance',
  },
  sections: {
    hero: {
      title: 'Travel Insurance for UAE Residents',
      subtitle:
        'Book outbound travel insurance from the UAE for residents and citizens. Our travel insurances are genuine, legitimate, and accepted for various purposes, including embassies for visa applications. These are strictly for UAE residents/citizens.',
      form: <AllForms forms={['ticket']} />,
    },
    process: {
      title: 'How to book your travel insurance?',
      subtitle:
        "Get your travel insurance in 3 quick, simple, and hassle-free steps. Here's how it works:",
    },
    about: {
      title: 'About us',
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Insurance",
          description: "Genuine AXA-backed travel insurance meeting Schengen embassy requirements. Covers emergency medical treatment, trip cancellations, and baggage loss. Issued and delivered instantly.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Tickets",
          description: "Verifiable flight reservations with a real PNR code — often required alongside insurance for a Schengen visa application. Accepted by embassies and visa centres. From USD 13.",
        },
        {
          icon: <MdOutlineLuggage />,
          title: "Onward Tickets",
          description: "Proof of onward travel for immigration and airline check-in. Verifiable PNR, accepted airline format, instant delivery.",
        },
      ],
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
          'Policies issued by AXA',
          'Accepted by embassies',
          'For UAE residents only',
          'Delivered instantly',
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
      />
      <About
        title={pageData.sections.about.title}
        services={pageData.sections.about.services}
      />
    </>
  );
}
