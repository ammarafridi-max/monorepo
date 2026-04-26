import { lazy, Suspense } from 'react';
import { faqArray, formatFaqArray } from '@/data/faqs';
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
  HiCheck,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';
import Hero from '@travel-suite/frontend-shared/components/v1/sections/Hero';
import AllForms from '@travel-suite/frontend-shared/components/v1/forms/AllForms';

const Process = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Process'));
const About = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/About'));
const Benefits = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Benefits'));
const Testimonials = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Testimonials'));
const FAQ = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/FAQ'));
const Contact = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/Contact'));
const BlogPosts = lazy(() => import('@travel-suite/frontend-shared/components/v1/sections/BlogPosts'));

const keyword = 'onward ticket';

const testimonials = [
  {
    title: 'Stress-Free',
    name: 'David S.',
    img: '/david.webp',
    text: 'MDT made my visa process incredibly smooth and totally stress-free. The booking was fast, the ticket looked real, and I had no issues at the embassy. Great service for anyone needing quick and professional travel documents on short notice.',
    purpose: 'Traveler from the United States',
  },
  {
    title: 'Dependable',
    name: 'Maria K.',
    img: '/maria.webp',
    text: 'I was in a rush and MDT delivered exactly what I needed. The process was simple, the service was reliable, and I had my ticket ready in minutes. It saved me a lot of stress when applying for my visa. Definitely using this again in the future.',
    purpose: 'Tourist from the United Kingdom',
  },
  {
    title: 'Super Fast',
    name: 'Ahmed R.',
    img: '/ahmed.webp',
    text: 'The entire experience with MDT was seamless from start to finish. I got my onward ticket within minutes, and it worked perfectly for my Schengen visa. Fast response, clear instructions, and great support - highly recommend to travelers in need.',
    purpose: 'Frequent Flyer from India',
  },
];

export const benefits = [
  {
    title: 'Accepted Worldwide',
    text: 'Our onward tickets are issued through official airline systems with a real PNR — accepted by airlines at check-in and by immigration officers at border crossings.',
    icon: HiCheck,
  },
  {
    title: 'Instant Delivery',
    text: 'Our automated system delivers your onward ticket to your inbox within 10–15 minutes, 24/7. No waiting for business hours, no manual processing.',
    icon: HiOutlineClock,
  },
  {
    title: 'Only AED 49',
    text: 'A real onward flight can cost hundreds of dirhams with no guarantee of a refund. Our verified onward ticket costs AED 49 — zero financial risk if your plans change.',
    icon: HiOutlineCurrencyDollar,
  },
  {
    title: 'Extended Validity',
    text: 'Our reservations stay active for 7 or 14 days from issue — far longer than standard airline holds. Plenty of time to clear immigration or complete your visa application.',
    icon: HiOutlineClock,
  },
  {
    title: 'Visa-Friendly Format',
    text: 'Every onward ticket follows the exact itinerary format immigration officers and embassies expect — with passenger name, route, dates, and PNR clearly displayed.',
    icon: HiCheck,
  },
  {
    title: 'Specialist Support',
    text: 'Our travel documentation team responds within 2 hours. Need a date change, confirmation letter, or help with a specific entry requirement? We handle it.',
    icon: HiCheck,
  },
];

export const pageData = {
  meta: {
    title: 'Onward Ticket From AED 49 | Instant, Genuine, & Affordable',
    description:
      'Travelers use onward tickets for travel purposes, such as to show as proof of onward travel at airports. Book yours with us now. Starting from AED 49.',
    canonical: 'https://www.mydummyticket.ae/onward-ticket',
  },
  sections: {
    hero: {
      title: 'Onward Ticket From AED 49. Verified Proof of Outbound Travel.',
      subtitle:
        'Get a verified onward ticket issued through official airline systems with a real, verifiable PNR. Our reservations are legitimate bookings accepted by airlines and immigration officers worldwide — not fake or falsified documents.',
      form: <AllForms />,
    },
    process: {
      title: 'Your Onward Ticket, Ready in 3 Easy Steps',
      subtitle: 'How To Book Your Reservation',
      keyword,
    },
    about: {
      title: 'About Us',
      text: "We've been issuing verified flight reservations since 2008 — over 16 years of specialist experience in travel documentation. Every year, we issue 10,000+ onward tickets to travelers who need proof of outbound travel for immigration, airline check-in, or visa requirements. Our reservations follow accepted airline formats, include a valid PNR, and are accepted by airlines and immigration officers worldwide.",
      keyword,
    },
    benefits: {
      title: 'Why Book Your Onward Ticket With Us?',
      subtitle: 'Trusted supplier based in Dubai',
      benefits,
    },
    testimonials: {
      title: 'Testimonials',
      subtitle: 'What our customers say about us',
      testimonials,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions answered',
      faqs: [
        {
          question: 'What is an onward ticket?',
          answer:
            'An onward ticket is a confirmed flight reservation showing you will leave your destination country. It proves to immigration officers and airlines that you have a concrete travel plan beyond your arrival — required for many visa-on-arrival countries and transit situations.',
        },
        {
          question: 'Which countries require an onward ticket?',
          answer:
            'Many countries require proof of onward travel on arrival, including Thailand, Vietnam, Indonesia, Costa Rica, Peru, and others. Some airlines also require it before boarding. Our verified reservations are accepted across all major destinations.',
        },
        {
          question:
            'What is the difference between an onward ticket and a dummy ticket?',
          answer:
            'A dummy ticket is used for visa applications — it demonstrates travel intent to an embassy. An onward ticket is used at the airport — it demonstrates to immigration officers that you will leave the country. Both are verifiable reservations; the use case is different.',
        },
        {
          question: 'How long is the onward ticket valid for?',
          answer:
            'Our onward tickets stay active for 7 or 14 days from the date of issue, depending on the option you choose at checkout. This covers standard immigration checks and short-stay visa processing timelines.',
        },
        {
          question: 'Do you offer refunds if I no longer need the ticket?',
          answer:
            'As we provide an immediate digital documentation service, we do not offer refunds once the onward ticket has been delivered. If your travel dates change, we can re-issue your reservation with updated details at no extra charge.',
        },
      ],
    },
    blogs: {
      title: 'Blog Posts',
      subtitle: 'Recently published blog posts',
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
        <Testimonials
          title={pageData.sections.testimonials.title}
          subtitle={pageData.sections.testimonials.subtitle}
          testimonials={pageData.sections.testimonials.testimonials}
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
        <BlogPosts
          title={pageData.sections.blogs.title}
          subtitle={pageData.sections.blogs.subtitle}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Contact />
      </Suspense>
    </>
  );
}
