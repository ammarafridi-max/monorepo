import { EMAIL } from '@/config/contact';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';
import PricingTiers from '@/components/lp/PricingTiers';
import BookCta from '@/components/lp/BookCta';
import StickyBookingBar from '@/components/lp/StickyBookingBar';
import { SITE_URL } from '@/lib/schema';
import { Check, Clock, DollarSign } from 'lucide-react';
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';

const keyword = 'flight reservation';

const processSteps = [
  {
    title: 'Tell us what you need',
    text: 'Fill in your trip details, travel dates, and traveler information using our simple online form. The whole process takes less than two minutes.',
  },
  {
    title: 'Choose your service',
    text: 'Select a flight reservation or travel insurance, then pick the validity period that works best for your visa application. Need a hotel reservation too? Email us the trip details and we will arrange it for you.',
  },
  {
    title: 'Pay and receive instantly',
    text: 'Complete your secure payment and your documents arrive in your inbox within 10 to 15 minutes, any time of day. No office visits, no waiting around.',
  },
];

const testimonials = [
  {
    quote: 'Travl made my visa process incredibly smooth and totally stress-free. The booking was fast, the reservation looked real, and I had no issues at the embassy. Great service for anyone needing quick and professional travel documents on short notice.',
    name: 'David S.',
    location: 'Traveler from the United States',
    stars: 5,
  },
  {
    quote: 'I was in a rush and Travl delivered exactly what I needed. The process was simple, the service was reliable, and I had my reservation ready in minutes. It saved me a lot of stress when applying for my visa. Definitely using this again in the future.',
    name: 'Maria K.',
    location: 'Tourist from the United Kingdom',
    stars: 5,
  },
  {
    quote: 'The entire experience with Travl was seamless from start to finish. I got my flight reservation within minutes, and it worked perfectly for my Schengen visa. Fast response, clear instructions, and great support. Highly recommend to travelers in need.',
    name: 'Ahmed R.',
    location: 'Frequent Flyer from India',
    stars: 5,
  },
];

const benefits = [
  {
    title: 'Accepted by VFS',
    text: 'We issue flight reservations through official airline systems, ensuring they are 100% genuine, verifiable, and widely accepted by embassies and consulates.',
    icon: Check,
  },
  {
    title: 'Instant Delivery',
    text: 'Your flight reservation is sent to your inbox within 10 to 15 minutes of payment, 24 hours a day, 7 days a week. No waiting for business hours.',
    icon: Clock,
  },
  {
    title: 'Great Value',
    text: 'Starting from just AED 49, we offer high-quality, embassy-compliant flight reservations at an affordable price, so you save money without sacrificing reliability.',
    icon: DollarSign,
  },
];

const faqTemplates = [
  {
    question: 'What is a {keyword}?',
    answer:
      'A {keyword} is a genuine booking issued on airline systems with a valid PNR, commonly used to demonstrate confirmed travel plans for trip-planning purposes.',
  },
  {
    question: 'How can I verify the {keyword}?',
    answer:
      'Every booking is a real reservation with a live PNR. It can be verified through the global distribution systems (Amadeus, Sabre, Travelport) that embassies, airlines and travel agents use. With selected airlines, including Emirates and Etihad, you can also check it directly on their website under Manage Booking. Not every airline shows unpaid reservations on its own site, so the GDS check is the one that always works.',
  },
  {
    question: 'How much does a {keyword} cost?',
    answer:
      'Pricing depends on the validity period you select, not on availability. A {keyword} valid for 2 days is AED 49, 7 days is AED 69, and 14 days is AED 79. The same price covers both one way and return {keyword}s, per person.',
  },
  {
    question: 'How long is your {keyword} valid for?',
    answer:
      'You choose the validity period at checkout. A {keyword} can be valid for 2 days at AED 49, 7 days at AED 69, or 14 days at AED 79.',
  },
  {
    question: 'How long does it take to receive my {keyword}?',
    answer:
      'All of our {keyword}s are created and sent within 10 to 15 minutes of payment, 24 hours a day, 7 days a week. If you need it faster, email us with your order reference and we will prioritise it.',
  },
  {
    question: 'Do {keyword}s work for Schengen applications?',
    answer:
      'Yes. Our {keyword}s meet documentation requirements requested by embassies and application centers, including VFS. They provide verified proof of travel intent and itinerary, increasing your chances of approval.',
  },
  {
    question: 'Will my application get rejected due to {keyword}s?',
    answer:
      'Not at all. {keyword}s are completely fine and accepted by VFS and embassies. They will improve your chances of getting your application approved.',
  },
  {
    question: 'I need hotel reservations too. Can you provide that?',
    answer:
      "Yes, we do. We specialize in all kinds of travel documentation and assistance, which means that we provide flight reservations, hotel reservations, travel insurance, trip itinerary and all other related documents needed to get your applications approved. Please send us an email with the trip details and we'll be happy to make you a hotel reservation.",
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      "We accept multiple payment methods. You can choose to pay on our website through Stripe's secure Checkout application or transfer money through a payment link (available on request).",
  },
  {
    question: 'Is the {keyword} suitable for all travel applications?',
    answer:
      'Yes, our {keyword}s are suitable and acceptable for all kinds of travel applications, including but not limited to Schengen, Turkey, Canada, Thailand, UAE, and UK.',
  },
  {
    question: 'What additional services do you offer?',
    answer:
      'Besides {keyword}s, we also offer hotel reservations, travel insurance (genuine and official), travel documentation assistance, and airport transfer arrangement.',
  },
  {
    question: 'How can I contact customer support?',
    answer: `Email us at ${EMAIL}. Support is available 24/7 and replies within 10 to 15 minutes.`,
  },
  {
    question: 'Is there a money-back guarantee?',
    answer:
      'Yes, in one case. If your visa is refused because the flight reservation we sent had expired or was invalid, email us the refusal letter and we refund the order in full. We do not refund for a change of plans or for a refusal on other grounds. If your appointment moves, we re-issue the reservation with new dates at no extra charge.',
  },
];

const faqs = faqTemplates.map(({ question, answer }) => ({
  question: question.replaceAll('{keyword}', keyword),
  answer: answer.replaceAll('{keyword}', keyword),
}));

const pageData = {
  meta: {
    title: 'Flight Reservation in UAE From AED 49 | Verifiable PNR',
    description:
      'Book embassy-ready flight reservations from AED 49 with verifiable PNR references and fast delivery for visa applications from the UAE.',
    canonical: `${SITE_URL}/lp/flight-reservation`,
  },
  sections: {
    hero: {
      title: 'Flight Reservation From AED 49. Verifiable and Legit.',
      subtitle:
        'A flight reservation is a real airline booking with a live PNR, not a purchased ticket. Use it for visa applications, airline check-in, proof of onward travel, and immigration checks. Verify it on the global GDS that embassies use. From AED 49, delivered by email in minutes.',
    },
    process: {
      title: 'How Do You Book a Flight Reservation?',
      subtitle:
        'How it Works with quick steps and clear guidance from search to delivery',
    },
    about: {
      title: 'About Us',
      text: (
        <>
          Embassies ask for evidence of transport as part of a visa file. Article 14
          of the{' '}
          <a
            href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32009R0810"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-gray-900"
          >
            EU Visa Code
          </a>{' '}
          sets that out for Schengen applications, and a reservation with a live PNR
          satisfies it without buying a ticket.
        </>
      ),
      services: [
        {
          icon: <MdOutlineAirplaneTicket />,
          title: 'Flight Reservations',
          description:
            'Genuine flight reservations with a verifiable PNR code, issued through official airline systems. Accepted by VFS, BLS, and embassies worldwide. Perfect proof of onward travel for your visa application.',
        },
        {
          icon: <MdOutlineHotel />,
          title: 'Hotel Reservations',
          description:
            "Need proof of accommodation for your visa application? We provide hotel reservations by email, formatted to meet embassy requirements. Just reach out and we'll have it ready for you quickly.",
        },
        {
          icon: <MdOutlineHealthAndSafety />,
          title: 'Travel Insurance',
          description:
            'Schengen-compliant travel insurance meeting the required EUR 30,000 medical coverage. Genuine AXA-backed policies issued instantly, bundled or standalone alongside your flight reservation.',
        },
      ],
    },
    benefits: {
      title: 'Why Choose Travl?',
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
      faqs,
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
    index: false,
    follow: false,
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

export default function FlightReservationLandingPage() {
  return (
    <>
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
      <PricingTiers title="How Much Does a Flight Reservation Cost?" keyword={keyword} />
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
      <BookCta className="pb-16 md:pb-20 px-6" />
      <BlogPosts
        title={pageData.sections.blogs.title}
        subtitle={pageData.sections.blogs.subtitle}
      />
      <Contact email={EMAIL} replyTime="within 10 to 15 minutes, 24/7" />
      <StickyBookingBar label="Book now" product={keyword} />
    </>
  );
}
