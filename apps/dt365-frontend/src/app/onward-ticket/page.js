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
import { HiCheck, HiOutlineClock, HiOutlineCurrencyDollar } from 'react-icons/hi';
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineLuggage } from 'react-icons/md';
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
    text: 'DT365 made my visa process incredibly smooth and totally stress-free. The booking was fast, the ticket looked real, and I had no issues at the embassy. Great service for anyone needing quick and professional travel documents on short notice.',
    purpose: 'Traveler from the United States',
  },
  {
    title: 'Dependable',
    name: 'Maria K.',
    img: '/maria.webp',
    text: 'I was in a rush and DT365 delivered exactly what I needed. The process was simple, the service was reliable, and I had my ticket ready in minutes. It saved me a lot of stress when applying for my visa. Definitely using this again in the future.',
    purpose: 'Tourist from the United Kingdom',
  },
  {
    title: 'Super Fast',
    name: 'Ahmed R.',
    img: '/ahmed.webp',
    text: 'The entire experience with DT365 was seamless from start to finish. I got my onward ticket within minutes, and it worked perfectly for my Schengen visa. Fast response, clear instructions, and great support — highly recommend to travelers in need.',
    purpose: 'Frequent Flyer from India',
  },
];

const benefits = [
  {
    title: 'Accepted by VFS',
    text: 'We issue onward tickets through official airline systems, ensuring they are 100% genuine, verifiable, and widely accepted by embassies and consulates.',
    icon: HiCheck,
  },
  {
    title: 'Instant Delivery',
    text: 'Our automated process ensures you receive your onward ticket by email within minutes—quick, seamless, and completely hassle-free.',
    icon: HiOutlineClock,
  },
  {
    title: 'Great Value',
    text: 'Starting from just USD 49, we offer high-quality, embassy-compliant onward tickets at an affordable price, so you save money without sacrificing reliability.',
    icon: HiOutlineCurrencyDollar,
  },
];

const pageData = {
  meta: {
    title: 'Onward Ticket From USD 49 | Instant, Genuine, & Affordable',
    description:
      'Travelers use onward tickets for travel purposes, such as to show as proof of onward travel at airports. Book yours with us now. Starting from USD 13.',
    canonical: 'https://www.dummyticket365.com/onward-ticket',
  },
  sections: {
    hero: {
      title: 'Book a Your Onward Ticket from USD 49.',
      subtitle:
        'Get onward tickets issued through official airline systems with a valid, verifiable PNR. Our flight reservations are legitimate bookings created for travel documentation purposes, not fake or falsified tickets.',
      form: <AllForms forms={['ticket']} />,
    },
    process: {
      title: 'Your Onward Ticket, Ready in 3 Easy Steps',
      subtitle: 'How To Book Your Reservation',
      keyword,
    },
    about: {
      title: 'About Us',
      text: 'We are an international travel services provider offering verifiable flight reservations and related travel documentation for travelers worldwide. Our services are used by thousands of customers each year for onward travel, immigration checks, and airline requirements. All reservations follow accepted airline formats and include a valid PNR code for verification',
      services: [
        {
          icon: <MdOutlineLuggage />,
          title: "Onward Tickets",
          description: "Verifiable flight reservations accepted by airlines and immigration officers worldwide. Includes a valid PNR, follows accepted airline formats, and is delivered instantly — without financial risk.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Tickets",
          description: "Verifiable dummy flight tickets for visa applications. Accepted by Schengen, UK, US, and Canadian embassies and visa centres. From USD 13.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Insurance",
          description: "Schengen-compliant travel insurance issued by AXA. A practical addition to your travel documentation when applying for a European visa.",
        },
      ],
    },
    benefits: {
      title: 'Why Choose Dummy Ticket 365?',
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
      faqs: formatFaqArray(faqArray, keyword),
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
          'Onward tickets from $13',
          'Issued via official airline systems',
          'Valid, verifiable PNR',
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
