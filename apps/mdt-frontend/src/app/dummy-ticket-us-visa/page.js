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
  FaCalendarAlt,
  FaCheckCircle,
  FaFileAlt,
  FaHeadset,
  FaMoneyBillWave,
  FaShieldAlt,
} from 'react-icons/fa';
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';

const keyword = 'dummy ticket';

const testimonials = [
  {
    quote: 'MDT made my US visa process incredibly smooth and totally stress-free. The booking was fast, the dummy ticket looked genuine, and I had no issues at the embassy. Great service for anyone needing quick and professional US visa travel documents.',
    name: 'David S.',
    location: 'Traveler from the United States',
    stars: 5,
  },
  {
    quote: 'I was in a rush for my US visa appointment and MDT delivered exactly what I needed. The process was simple, reliable, and my dummy ticket was ready in minutes. It saved me a lot of stress during my application. Definitely using this again.',
    name: 'Maria K.',
    location: 'Tourist from the United Kingdom',
    stars: 5,
  },
  {
    quote: 'The entire experience with MDT was seamless from start to finish. I got my dummy ticket for US visa within minutes and it worked perfectly for my submission. Fast response, clear instructions, and great support - highly recommend.',
    name: 'Ahmed R.',
    location: 'Frequent Flyer from India',
    stars: 5,
  },
];

export const benefits = [
  {
    title: 'Verifiable PNRs',
    text: 'Every dummy ticket for your US visa includes a genuine airline reservation with a verifiable PNR. Visa officers can confirm it directly on the airline’s official website. Unlike temporary holds, validity depends on the plan you select.',
    icon: FaCheckCircle,
  },
  {
    title: 'Accepted Formats',
    text: 'Our dummy tickets for US visa applications are formatted professionally with accurate routes, timings, and traveler details. The structured presentation aligns with embassy expectations and keeps your documentation clear and easy to review.',
    icon: FaFileAlt,
  },
  {
    title: 'Low-Risk Travel Solution',
    text: 'Buying a real ticket before US visa approval can be risky and expensive. Our dummy ticket removes that financial risk by giving you a confirmed reservation without paying for the full flight, while still allowing adjustments if needed.',
    icon: FaShieldAlt,
  },
  {
    title: 'Affordable Service',
    text: 'Hire a licensed travel agency in Dubai trusted by applicants worldwide for credible US visa travel documents. With packages starting from AED 49, you get an affordable dummy ticket solution without compromising professionalism or authenticity.',
    icon: FaMoneyBillWave,
  },
  {
    title: 'Instant Delivery',
    text: 'We deliver your dummy ticket quickly, often within minutes, so you’re never left waiting before submission. Our UAE-based support team is responsive, helpful, and ready 24/7 to assist with verification or changes.',
    icon: FaHeadset,
  },
  {
    title: 'Flexible Validity Options',
    text: 'Choose the validity that suits your US visa appointment schedule. Options include 48 hours, 7 days, or 14 days depending on airline availability, giving you flexibility and peace of mind throughout the process.',
    icon: FaCalendarAlt,
  },
];

export const pageData = {
  meta: {
    title: 'Dummy Ticket for US Visa from AED 49 | Verifiable, Instant',
    description:
      'Book verified dummy tickets for a US visa with real PNR. Our reservations are accepted by all US embassies across the world. Instant delivery.',
    canonical: 'https://www.mydummyticket.ae/dummy-ticket-us-visa',
    keywords: 'dummy ticket for us visa',
  },
  sections: {
    hero: {
      title: 'Verifiable Dummy Tickets for US Visa from AED 49.',
      subtitle:
        'Book your verifiable dummy tickets for US visa. Our reservations come with a valid 6-digit PNR number that can be used to verify the reservation, and are commonly used for US B1/B2 visas.',
      form: <AllForms />,
    },
    process: {
      title: 'How to Book Your Dummy Ticket for US Visa',
      subtitle:
        'Get a verified dummy ticket for US visa quickly with secure booking, instant email delivery, embassy acceptance, and responsive support',
      keyword,
    },
    about: {
      title: 'About Us',
      text: 'We are an international travel services provider offering verifiable flight reservations and related travel documentation for travelers worldwide. Our services are used by thousands of customers each year for onward travel, immigration checks, and airline requirements. All reservations follow accepted airline formats and include a valid PNR code for verification',
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Dummy Tickets for US Visa',
          description:
            'Verifiable flight reservations with a real PNR code, in the format required for a US B1/B2 visa application. Issued through official airline systems and delivered instantly.',
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Genuine AXA-backed travel insurance for UAE residents. Covers medical emergencies, trip cancellations, and baggage loss — delivered instantly after payment.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            'We provide hotel reservations by email, formatted to meet embassy requirements. A practical solution when your US visa application needs proof of accommodation.',
        },
      ],
    },
    benefits: {
      title: 'Why Choose My Dummy Ticket for Your US Visa?',
      subtitle:
        'Enjoy a reliable dummy ticket for US visa with verified PNR, instant delivery, affordable pricing, trusted service, and dedicated customer support',
      benefits,
    },
    testimonials: {
      title: 'What Travelers Say About Our Dummy Tickets',
      subtitle:
        'Real customers share how our fast, reliable, and embassy-accepted dummy tickets helped them submit stronger US visa applications confidently',
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
          'Verifiable PNR Code',
          'US Embassy Accepted Format',
          'Delivered in Minutes',
          'Starts from AED 49',
        ]}
        breadcrumbPaths={[
          { label: 'Home', href: '/' },
          { label: 'Dummy Ticket for US Visa' },
        ]}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
      />
      <About title={pageData.sections.about.title} services={pageData.sections.about.services} />
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
      <Contact email="info@mydummyticket.ae" />
    </>
  );
}
