import Hero from "@travel-suite/frontend-shared/components/sections/v2/Hero";
import HowItWorks from "@travel-suite/frontend-shared/components/sections/v2/HowItWorks";
import About from "@travel-suite/frontend-shared/components/sections/v2/About";
import Benefits from "@travel-suite/frontend-shared/components/sections/v2/Benefits";
import Testimonials from "@travel-suite/frontend-shared/components/sections/v2/Testimonials";
import Faqs from "@travel-suite/frontend-shared/components/sections/v2/Faqs";
import Contact from "@travel-suite/frontend-shared/components/sections/v2/Contact";
import BlogPosts from "@travel-suite/frontend-shared/components/sections/v2/BlogPosts";
import {
  SITE_URL,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from "@/lib/schema";
import { homepageFaqs } from "@/data/faqs";
import { ShieldCheck, Zap, FileCheck, Headphones, Banknote, Globe } from "lucide-react";
import { MdOutlineAirplaneTicket, MdOutlineHealthAndSafety, MdOutlineHotel } from "react-icons/md";

const testimonials = [
  {
    quote: "Travl made my visa process incredibly smooth. The insurance policy had the full medical coverage, covered all Schengen countries, and arrived instantly. My visa was approved without any problems.",
    name: "David S.",
    location: "Traveler from the United States",
    stars: 5,
  },
  {
    quote: "I was in a rush and Travl delivered exactly what I needed. The process was simple, the service was reliable, and I had my insurance ready in minutes. Definitely using this again.",
    name: "Maria K.",
    location: "Tourist from the United Kingdom",
    stars: 5,
  },
  {
    quote: "I got my Schengen travel insurance through Travl and it was straightforward. The policy had the full medical coverage, covered all Schengen countries, and arrived instantly. My visa was approved without any problems.",
    name: "Ahmed R.",
    location: "Frequent Flyer from India",
    stars: 5,
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Travel Insurance from AED 30",
    text: "Schengen-compliant travel insurance with the required medical coverage, valid across all 26 Schengen states. Issued instantly and delivered straight to your inbox.",
  },
  {
    icon: Zap,
    title: "Instant Document Delivery",
    text: "Every policy, flight itinerary, and hotel reservation is delivered to your inbox within minutes of payment. No office visit, no waiting.",
  },
  {
    icon: FileCheck,
    title: "Embassy-Accepted Formats",
    text: "All documents are formatted to meet the requirements of embassies, VFS Global, and BLS International. Submit with confidence.",
  },
  {
    icon: Headphones,
    title: "24/7 Customer Support",
    text: "Our team is available around the clock to answer questions, resend documents, or help with any issue before your visa appointment.",
  },
  {
    icon: Globe,
    title: "Covers 180+ Countries",
    text: "From Schengen to worldwide plans, our travel insurance covers destinations across Europe, Asia, the Americas, and beyond.",
  },
  {
    icon: Banknote,
    title: "No Hidden Fees",
    text: "The price you see is the price you pay. No admin charges, no processing fees — transparent pricing on every order.",
  },
];

const pageData = {
  meta: {
    title: "Travel Insurance for UAE Residents | Travl",
    description:
      "Get travel insurance for your visa application. Instant delivery. Trusted by UAE residents. From AED 30.",
    canonical: SITE_URL,
  },
  sections: {
    hero: {
      title: "Travel Insurance for UAE Residents",
      text: "Travl is a Dubai-based travel agency offering travel insurance for visa applications. Order online and receive your policy in minutes.",
      pills: [
        "Instant Document Delivery",
        "Visa-Ready Formats",
        "Dubai Licensed Agency",
        "24/7 Customer Support",
      ],
    },
    process: {
      title: "How It Works",
      subtitle:
        "Three steps to get your travel documents sorted, no matter which service you need",
    },
    about: {
      title: "About Us",
      services: [
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Insurance",
          description:
            "Genuine AXA-backed travel insurance for UAE residents. Schengen-compliant plans from AED 30, worldwide coverage from AED 70, and annual multi-trip plans from AED 245. Every policy is delivered instantly after payment.",
        },
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Flight Itineraries",
          description:
            "Verifiable flight reservations with a real PNR code, accepted by VFS, BLS, and embassies. Required alongside insurance for most Schengen and international visa applications. From AED 49.",
        },
        {
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description:
            "Proof of accommodation formatted to meet embassy and consulate standards. Ready to include in your visa application package alongside your insurance and flight itinerary.",
        },
      ],
    },
    benefits: {
      title: "Why UAE Residents Choose Travl",
      subtitle:
        "A licensed travel agency based in Dubai, trusted for fast and reliable visa documentation across the UAE and GCC",
      benefits,
    },
    testimonials: {
      title: "What Our Customers Say",
      subtitle:
        "Real feedback from travelers across the UAE who used Travl for their visa documents",
      testimonials,
    },
    faqs: {
      title: "Frequently Asked Questions",
      subtitle:
        "Common questions about our services, delivery times, and what you need for your visa application",
      faqs: homepageFaqs,
    },
    blogs: {
      title: "From the Blog",
      subtitle:
        "Guides and tips on visa applications, travel documents, and planning your trip from the UAE",
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
    card: "summary_large_image",
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
      areaServed: "AE",
    }),
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: "Frequently Asked Questions",
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
        text={pageData.sections.hero.text}
        pills={pageData.sections.hero.pills}
      />
      <HowItWorks
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
      />
      <About
        title={pageData.sections.about.title}
        text="Travl Technologies LLC is a licensed travel agency based in Dubai, UAE. We help residents across the UAE and GCC get the travel documents they need for visa applications, quickly and without hassle."
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
      <Faqs
        title={pageData.sections.faqs.title}
        subtitle={pageData.sections.faqs.subtitle}
        faqs={pageData.sections.faqs.faqs}
      />
      <BlogPosts
        title={pageData.sections.blogs.title}
        subtitle={pageData.sections.blogs.subtitle}
      />
      <Contact email="info@travl.ae" />
    </>
  );
}
