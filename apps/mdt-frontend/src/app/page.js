import { EMAIL } from '@/config/contact';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import PricingTiers from '@/components/PricingTiers';
import { processSteps } from '@/data/processSteps';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';
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
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';

const keyword = 'dummy ticket';

const testimonials = [
  {
    quote: 'MDT made my visa process incredibly smooth and totally stress-free. The booking was fast, the ticket looked real, and I had no issues at the embassy. Great service for anyone needing quick and professional travel documents on short notice.',
    name: 'David S.',
    location: 'Traveler from the United States',
    stars: 5,
  },
  {
    quote: 'I was in a rush and MDT delivered exactly what I needed. The process was simple, the service was reliable, and I had my ticket ready in minutes. It saved me a lot of stress when applying for my visa. Definitely using this again in the future.',
    name: 'Maria K.',
    location: 'Tourist from the United Kingdom',
    stars: 5,
  },
  {
    quote: 'The entire experience with MDT was seamless from start to finish. I got my dummy ticket within minutes, and it worked perfectly for my Schengen visa. Fast response, clear instructions, and great support - highly recommend to travelers in need.',
    name: 'Ahmed R.',
    location: 'Frequent Flyer from India',
    stars: 5,
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
    title: 'Dummy Ticket in UAE From AED 49 | Verifiable PNR',
    description:
      'Book embassy-ready dummy tickets from AED 49 with verifiable PNR references and fast delivery for visa applications from the UAE.',
    canonical: SITE_URL,
    entityName: 'Dummy Ticket',
  },
  sections: {
    hero: {
      title: 'Dummy Ticket From AED 49. Verifiable and Legit.',
      subtitle:
        'A dummy ticket is a real flight reservation with a live PNR, not a purchased ticket. Use it for visa applications, airline check-in, proof of onward travel, and immigration checks. Verify it on the global GDS that embassies use. From AED 49, delivered by email in minutes.',
    },
    process: {
      title: 'How Do You Book a Dummy Ticket?',
      subtitle:
        'How it Works with quick steps and clear guidance from search to delivery',
    },
    about: {
      title: 'About Us',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Dummy Tickets',
          description:
            'Genuine flight reservations with a verifiable PNR code, issued through official airline systems. Accepted by VFS, BLS, and embassies worldwide. Perfect proof of onward travel for your visa application.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'Need proof of accommodation for your visa application? We provide hotel reservations by email, formatted to meet embassy requirements. Just reach out and we\'ll have it ready for you quickly.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Schengen-compliant travel insurance meeting the required EUR 30,000 medical coverage. Genuine AXA-backed policies issued instantly, bundled or standalone alongside your dummy ticket.',
        },
      ],
    },
    benefits: {
      title: 'Why Choose My Dummy Ticket?',
      subtitle:
        'Trusted supplier based in Dubai with proven customer reliability and support quality',
      benefits,
    },
    testimonials: {
      title: 'What Do Our Customers Say?',
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
      title: 'What Should You Read Next?',
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
      name: pageData.meta.entityName,
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
        pills={[
          'Accepted by VFS & BLS',
          'Verifiable PNR Code',
          'Delivered in Minutes',
          'Starts from AED 49',
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
        steps={processSteps}
      />

      <PricingTiers
        title="How Much Does a Dummy Ticket Cost?"
        keyword="dummy ticket"
      />
      <About
        title={pageData.sections.about.title}
        services={pageData.sections.about.services}
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
      <Contact email={EMAIL} />
    </>
  );
}
