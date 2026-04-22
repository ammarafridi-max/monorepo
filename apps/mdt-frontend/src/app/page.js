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
import { faqArray, formatFaqArray } from '@/data/faqs';
import { Check, Clock, DollarSign } from 'lucide-react';

const keyword = 'dummy ticket';

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
    text: 'The entire experience with MDT was seamless from start to finish. I got my dummy ticket within minutes, and it worked perfectly for my Schengen visa. Fast response, clear instructions, and great support - highly recommend to travelers in need.',
    purpose: 'Frequent Flyer from India',
  },
];

const benefits = [
  {
    title: 'Accepted by VFS',
    text: 'We issue dummy tickets through official airline systems, ensuring they are 100% genuine, verifiable, and widely accepted by embassies and consulates.',
    icon: Check,
  },
  {
    title: 'Instant Delivery',
    text: 'Our automated process ensures you receive your dummy ticket by email within minutes-quick, seamless, and completely hassle-free.',
    icon: Clock,
  },
  {
    title: 'Great Value',
    text: 'Starting from just AED 49, we offer high-quality, embassy-compliant dummy tickets at an affordable price, so you save money without sacrificing reliability.',
    icon: DollarSign,
  },
];

const pageData = {
  meta: {
    title: 'Dummy Ticket from AED 49 | Verifiable, Quick | My Dummy Ticket',
    description:
      'Book embassy-ready dummy tickets from AED 49 with verifiable PNR references and fast delivery for visa applications from the UAE.',
    canonical: SITE_URL,
  },
  sections: {
    hero: {
      title: 'Dummy Ticket From AED 49. Verifiable and Legit.',
      subtitle:
        'Book verifiable dummy tickets for visa applications. All legitimate reservations come with a PNR code that can be verified directly on airline websites in just a few clicks, helping you submit documents confidently and on time.',
    },
    process: {
      title: 'Simple, Hassle-Free Process',
      subtitle:
        'How it Works with quick steps and clear guidance from search to delivery',
    },
    about: {
      title: 'About Us',
      keyword,
    },
    benefits: {
      title: 'Why Choose My Dummy Ticket?',
      subtitle:
        'Trusted supplier based in Dubai with proven customer reliability and support quality',
      benefits,
    },
    testimonials: {
      title: 'Testimonials',
      subtitle:
        'What our customers say about us after successful visa use and approvals',
      testimonials,
    },
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle:
        'Common questions answered about booking, delivery, and verification for every traveler',
      faqs: formatFaqArray(faqArray, keyword),
    },
    blogs: {
      title: 'Blog Posts',
      subtitle:
        'Recently published blog posts with practical visa travel insights and useful updates',
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
        form={<AllForms />}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
      />
      <About
        title={pageData.sections.about.title}
        keyword={pageData.sections.about.keyword}
      />
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
