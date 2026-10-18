import { EMAIL, WHATSAPP_NUMBER } from '@/config/contact';
import QuickAnswer from '@/components/QuickAnswer';
import { getUsdPrices, usdTiers } from '@/lib/tiers';
import Hero from "@travel-suite/frontend-shared/components/sections/v1/Hero";
import AllForms from "@travel-suite/frontend-shared/components/forms/v1/AllForms";
import Process from "@travel-suite/frontend-shared/components/sections/v1/Process";
import About from "@travel-suite/frontend-shared/components/sections/v1/About";
import Benefits from "@travel-suite/frontend-shared/components/sections/v1/Benefits";
import Testimonials from "@travel-suite/frontend-shared/components/sections/v1/Testimonials";
import FAQ from "@travel-suite/frontend-shared/components/sections/v1/FAQ";
import Contact from "@travel-suite/frontend-shared/components/sections/v1/Contact";
import BlogPosts from "@travel-suite/frontend-shared/components/sections/v1/BlogPosts";
import RelatedPages from "@/components/RelatedPages";
import {
  SITE_URL,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from "@/lib/schema";
import {
  HiArrowsRightLeft,
  HiCheckBadge,
  HiGlobeAlt,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiShieldCheck,
} from "react-icons/hi2";
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
} from "react-icons/md";

const keyword = "dummy ticket";

const benefits = [
  {
    title: "Accepted for All Major Visa Types",
    text: "Our dummy flight tickets are accepted by embassies and consulates for Schengen, UK, US, and other visa applications. Thousands of travelers use our service every year for tourist, student, business, and family visas.",
    icon: HiCheckBadge,
  },
  {
    title: "Verifiable PNR & Embassy-Friendly",
    text: "Every reservation includes a verifiable PNR on global GDS platforms (Amadeus, Sabre, Travelport), the same systems embassies, visa officers, and travel agents use to confirm bookings. Suitable for embassy review and immigration verification.",
    icon: HiShieldCheck,
  },
  {
    title: "Cost-Effective Alternative",
    text: "Why pay for an expensive airline ticket before your visa is approved? Our dummy flight reservations provide valid proof of travel at a fraction of the cost, helping you avoid fees and financial risk.",
    icon: HiOutlineCurrencyDollar,
  },
  {
    title: "Internationally Compliant Format",
    text: "All itineraries follow standard airline reservation formats with accurate routes, dates, and airline details. This ensures your documents look professional and aligned with international travel standards.",
    icon: HiGlobeAlt,
  },
  {
    title: "Fast Email Delivery",
    text: "Short on time? Your dummy ticket is delivered quickly via email, making it ideal for last-minute visa appointments or urgent immigration requirements.",
    icon: HiOutlineClock,
  },
  {
    title: "Flexibility for Changing Plans",
    text: "If your travel plans change, that’s not an issue. Our dummy tickets let you plan ahead without being locked into non-refundable airfare, with updates available if needed.",
    icon: HiArrowsRightLeft,
  },
];

const testimonials = [
  {
    quote:
      "The process was quick and straightforward. I received my dummy ticket within minutes, and the PNR was fully verifiable. It worked exactly as expected for my onward travel requirement.",
    name: "David S.",
    location: "Traveler – Used dummy ticket for onward travel verification",
    stars: 5,
  },
  {
    quote:
      "I needed proof of onward travel on short notice and this service delivered instantly. The flight itinerary looked professional, the details were accurate, and everything checked out with the airline.",
    name: "Maria K.",
    location: "Tourist – Used dummy flight itinerary for airline check-in",
    stars: 5,
  },
  {
    quote:
      "Booking was simple and the dummy ticket arrived by email almost immediately. The PNR was valid and easy to verify, which made my travel process stress-free.",
    name: "Ahmed R.",
    location:
      "International Traveler – Used dummy ticket for immigration check",
    stars: 5,
  },
];

const faqs = [
  {
    question:
      "Is a dummy flight ticket the same as a dummy air ticket or a dummy ticket?",
    answer:
      "Yes, all three describe the same thing: an unticketed flight reservation held on a global distribution system with a verifiable PNR. The wording changes by country and by whoever is asking for it. Some consulates call it a flight itinerary or a temporary reservation. What matters is that the booking is live and can be retrieved, not what it is called.",
  },
  {
    question: "What is a dummy ticket?",
    answer:
      "A dummy ticket is a temporary flight reservation that shows your travel itinerary without purchasing a full airline ticket. It includes real airline details and a verifiable PNR, and is commonly used for visa applications and proof of onward travel.",
  },
  {
    question: "How long is your dummy ticket valid for?",
    answer:
      "You can choose a validity of 48 hours, 7 days, or 14 days. The selected validity should match the period during which you need to present proof of onward travel.",
  },
  {
    question: "Is it safe to use this service?",
    answer:
      "Yes. We use secure systems and accepted airline reservation formats to ensure your information and documents are handled safely and professionally.",
  },
  {
    question: "Do embassies guarantee visa approval with a dummy ticket?",
    answer:
      "No travel document can guarantee visa approval. A dummy ticket is only one supporting document that shows your intended travel plans, which many embassies request as part of the visa application process.",
  },
  {
    question: "How much does a dummy ticket cost?",
    answer:
      "A dummy ticket costs USD 13 for 2 days validity, USD 19 for 7 days, or USD 21 for 14 days. All three tiers include the same verifiable PNR and the same accepted format, so pick the validity that matches your appointment or travel window.",
  },
  {
    question: "Is a dummy ticket suitable for immigration checks?",
    answer:
      "A dummy ticket is commonly used when immigration officers request proof of onward travel. However, final acceptance is always at the discretion of immigration authorities.",
  },
];

const pageData = {
  meta: {
    title: "Dummy Ticket from USD 13 | Verifiable PNR for Visas & Travel",
    description:
      "Book a dummy ticket for onward travel with a verifiable PNR. Ideal for airline check-in and immigration checks. Instant email delivery. Starting from USD 13.",
    canonical: "https://www.dummyticket365.com",
    productName: 'Dummy Ticket',
  },
  sections: {
    hero: {
      title: "Dummy Tickets for Visa, Onward Travel From USD 13",
      subtitle:
        "A dummy ticket is a real flight reservation with a verifiable PNR, created through global GDS platforms (Amadeus, Sabre, Travelport). You will also see it called a dummy flight ticket or a dummy air ticket, and it is the same document. Use it for visa applications, airline check-in, proof of onward travel, and immigration checks. You pay for the reservation, not the flight, from USD 13, delivered by email in minutes.",
      form: <AllForms forms={["ticket"]} />,
    },
    process: {
      title: "Get Your Dummy Ticket in 3 Simple Steps",
      subtitle:
        "Dummy ticket booking takes a couple of minutes. Enter your route and dates, pick how long the reservation needs to stay live, and pay. The itinerary arrives by email with a verifiable PNR on it.",
      keyword,
    },
    about: {
      title: "About Us",
      text: "We are a trusted international travel services provider offering verifiable flight reservations and essential travel documentation for travelers worldwide. Each year, thousands of customers rely on our verifiable PNR dummy ticket services to meet travel requirements, onward tickets for immigration checks, airline policies, and visa application needs. You can expect:",
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: "Dummy Tickets",
          description:
            "Verifiable flight reservations with a real PNR code, accepted by embassies and visa centres worldwide. Used by thousands of travellers each year for Schengen, UK, US, Canadian, and other visa applications.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: "Travel Insurance",
          description:
            `Genuine AXA-backed travel insurance, Schengen-compliant and meeting the mandatory EUR 30,000 medical coverage requirement. Policies are arranged on request, so email your trip details to ${EMAIL} and we will prepare your cover.`,
        },
      ],
    },
    benefits: {
      title: "Why Choose DummyTicket365 for Reliable Flight Reservations?",
      subtitle:
        "Our flight reservation service makes your visa application process easier by focusing on accuracy, speed, and global acceptance so that you can submit your travel documents with confidence.",
      benefits,
    },
    testimonials: {
      title: "Testimonials",
      subtitle:
        "What travelers around the world say about our dummy ticket service",
      testimonials,
    },
    faqs: {
      title: "Frequently Asked Questions",
      subtitle: "Common questions answered",
      faqs: faqs,
    },
    blogs: {
      title: "Blog Posts",
      subtitle: "Recently published blog posts",
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

export default async function HomePage() {
  const usdPrices = await getUsdPrices();
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
      name: pageData.meta.productName,
      description: pageData.meta.description,
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
        subtitle={pageData.sections.hero.subtitle}
        form={<AllForms forms={["ticket"]} />}
        pills={[
          "Dummy tickets from USD 13",
          "Valid 6-digit PNR",
          "Accepted worldwide",
          "Delivered in minutes",
        ]}
      />
      <QuickAnswer
        question="What is a dummy ticket?"
        answer="A dummy ticket is a real but unticketed flight reservation carrying a verifiable six-character PNR, issued on Amadeus, Sabre or Travelport. Travellers use it for visa applications, airline check-in and proof of onward travel, where a reservation is what is asked for and a purchased ticket is not. It starts at USD 13 and arrives by email in minutes."
        tiers={usdTiers(usdPrices)}
      />
      <Process
        title={pageData.sections.process.title}
        subtitle={pageData.sections.process.subtitle}
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
      <RelatedPages
        title="Popular Dummy Ticket Pages"
        subtitle="Country-specific and product-specific options"
        links={[
          {
            anchor: "Dummy ticket for a Schengen visa",
            href: "/dummy-ticket-schengen-visa",
            blurb:
              "Schengen-ready reservation with verifiable PNR, accepted at VFS, BLS, and TLScontact.",
          },
          {
            anchor: "Dummy ticket for a UK visa",
            href: "/dummy-ticket-uk-visa",
            blurb:
              "Standard Visitor visa file ready, no paid ticket needed before approval.",
          },
          {
            anchor: "Dummy ticket for an Australia visa",
            href: "/dummy-ticket-australia-visa",
            blurb: "Formatted for the Subclass 600 ImmiAccount upload.",
          },
          {
            anchor: "Onward ticket for airline check-in",
            href: "/onward-ticket",
            blurb: "Proof of onward travel in three validity tiers from USD 13.",
          },
        ]}
      />
      <Contact
        whatsappNumber={WHATSAPP_NUMBER} email={EMAIL} />
    </>
  );
}
