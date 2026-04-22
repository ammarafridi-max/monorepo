import Hero from '@travel-suite/frontend-shared/components/v1/sections/Hero';
import AllForms from '@travel-suite/frontend-shared/components/v1/forms/AllForms';
import Process from '@travel-suite/frontend-shared/components/v1/sections/Process';
import About from '@travel-suite/frontend-shared/components/v1/sections/About';
import Benefits from '@travel-suite/frontend-shared/components/v1/sections/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/v1/sections/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/v1/sections/FAQ';
import Contact from '@travel-suite/frontend-shared/components/v1/sections/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/v1/sections/BlogPosts';
import {
  SITE_URL,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import { homepageFaqs } from '@/data/faqs';
import { Ticket, Building2, ShieldCheck } from 'lucide-react';

const testimonials = [
  {
    title: 'Sorted My Visa Docs Fast',
    name: 'David S.',
    img: '/david.webp',
    text: 'I needed a dummy ticket for my Schengen application and Travl had it in my inbox within minutes. The PNR was verifiable and the format was exactly what VFS required. Quick, reliable, and no stress.',
    purpose: 'Traveler from the United States',
  },
  {
    title: 'Hotel Reservation, No Problem',
    name: 'Maria K.',
    img: '/maria.webp',
    text: 'My visa required proof of accommodation and Travl sorted it the same day. The hotel reservation was in the right format and accepted by the embassy without any issues. I will definitely use them again.',
    purpose: 'Tourist from the United Kingdom',
  },
  {
    title: 'Great Value Insurance',
    name: 'Ahmed R.',
    img: '/ahmed.webp',
    text: 'I got my Schengen travel insurance through Travl and it was straightforward. The policy had the full medical coverage, covered all Schengen countries, and arrived instantly. My visa was approved without any problems.',
    purpose: 'Frequent Flyer from India',
  },
];

const benefits = [
  {
    title: 'Dummy Tickets from AED 49',
    text: 'Get a verifiable flight reservation with a real PNR, issued in a format accepted by visa officers. Suitable for Schengen, UK, Canada, Australia, and more. Delivered in minutes.',
    icon: Ticket,
  },
  {
    title: 'Hotel Reservations on Request',
    text: 'Need proof of accommodation for your visa? We provide hotel reservations formatted to meet embassy requirements, available on request for any destination.',
    icon: Building2,
  },
  {
    title: 'Travel Insurance from AED 30',
    text: 'Schengen-compliant travel insurance with the required medical coverage, valid across all 26 member states. Issued instantly and delivered straight to your inbox.',
    icon: ShieldCheck,
  },
];

const pageData = {
  meta: {
    title: 'Dummy Tickets, Insurance & Visa Docs in UAE | Travl',
    description:
      'Get dummy tickets, hotel reservations, and travel insurance for your visa application. Instant delivery. Trusted by UAE residents. From AED 30.',
    canonical: SITE_URL,
  },
  sections: {
    hero: {
      title: 'Visa Documents and Travel Services for UAE Residents',
      subtitle:
        'Travl is a Dubai-based travel agency offering dummy tickets, hotel reservations, and travel insurance for visa applications. Order online and receive your documents in minutes.',
    },
    process: {
      title: 'How It Works',
      subtitle:
        'Three steps to get your travel documents sorted, no matter which service you need',
    },
    about: {
      title: 'About Us',
    },
    benefits: {
      title: 'Why UAE Residents Choose Travl',
      subtitle:
        'A licensed travel agency based in Dubai, trusted for fast and reliable visa documentation across the UAE and GCC',
      benefits,
    },
    testimonials: {
      title: 'What Our Customers Say',
      subtitle:
        'Real feedback from travelers across the UAE who used Travl for their visa documents',
      testimonials,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle:
        'Common questions about our services, delivery times, and what you need for your visa application',
      faqs: homepageFaqs,
    },
    blogs: {
      title: 'From the Blog',
      subtitle:
        'Guides and tips on visa applications, travel documents, and planning your trip from the UAE',
    },
  },
};

export const metadata = {
  title: pageData.meta.title,
  description: pageData.meta.description,
  alternates: {
    canonical: pageData.meta.canonical,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: pageData.meta.canonical,
    title: pageData.meta.title,
    description: pageData.meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageData.meta.title,
    description: pageData.meta.description,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function HomePage() {
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({
      canonical: pageData.meta.canonical,
      title: pageData.meta.title,
      description: pageData.meta.description,
    }),
    buildService({
      canonical: pageData.meta.canonical,
      name: pageData.meta.title,
      description: pageData.meta.description,
      areaServed: 'AE',
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: 'Frequently Asked Questions',
      description: pageData.meta.description,
      faqs: pageData.sections.faqs.faqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Hero
        title={pageData.sections.hero.title}
        subtitle={pageData.sections.hero.subtitle}
        form={<AllForms defaultTab="ticket" />}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
      />
      <About title={pageData.sections.about.title} />
      <Benefits
        title={pageData.sections.benefits.title}
        subtitle={pageData.sections.benefits.subtitle}
        benefits={pageData.sections.benefits.benefits}
      />
      <Testimonials
        title={pageData.sections.testimonials.title}
        subtitle={pageData.sections.testimonials.subtitle}
        testimonials={pageData.sections.testimonials.testimonials}
      />
      <FAQ
        title={pageData.sections.faqs.title}
        subtitle={pageData.sections.faqs.subtitle}
        faqs={pageData.sections.faqs.faqs}
      />
      <BlogPosts
        title={pageData.sections.blogs.title}
        subtitle={pageData.sections.blogs.subtitle}
      />
      <Contact />
    </>
  );
}
