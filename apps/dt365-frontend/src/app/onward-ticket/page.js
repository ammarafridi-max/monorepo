import { faqArray, formatFaqArray } from '@/data/faqs';
import { buildMetadata, SITE_URL } from '@/lib/schema';
import {
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildService,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';
import { HiCheck, HiOutlineClock, HiOutlineCurrencyDollar } from 'react-icons/hi';
import { MdOutlineHealthAndSafety, MdOutlineHotel, MdOutlineLuggage } from 'react-icons/md';
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v1/Testimonials';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import BlogPosts from '@travel-suite/frontend-shared/components/sections/v1/BlogPosts';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';
import QuickAnswer from '@/components/QuickAnswer';
import RelatedPages from '@/components/RelatedPages';

const keyword = 'onward ticket';

const testimonials = [
  {
    quote: 'DT365 made my visa process incredibly smooth and totally stress-free. The booking was fast, the ticket looked real, and I had no issues at the embassy. Great service for anyone needing quick and professional travel documents on short notice.',
    name: 'David S.',
    location: 'Traveler from the United States',
    stars: 5,
  },
  {
    quote: 'I was in a rush and DT365 delivered exactly what I needed. The process was simple, the service was reliable, and I had my ticket ready in minutes. It saved me a lot of stress when applying for my visa. Definitely using this again in the future.',
    name: 'Maria K.',
    location: 'Tourist from the United Kingdom',
    stars: 5,
  },
  {
    quote: 'The entire experience with DT365 was seamless from start to finish. I got my onward ticket within minutes, and it worked perfectly for my Schengen visa. Fast response, clear instructions, and great support — highly recommend to travelers in need.',
    name: 'Ahmed R.',
    location: 'Frequent Flyer from India',
    stars: 5,
  },
];

const benefits = [
  {
    title: 'Accepted at Airline Check-In and Borders',
    text: 'Each onward ticket carries a verifiable PNR on global GDS platforms (Amadeus, Sabre, Travelport). Used for airline check-in, immigration officers, and border control where proof of onward travel is required.',
    icon: HiCheck,
  },
  {
    title: 'Instant Delivery',
    text: 'Our automated process ensures you receive your onward ticket by email within minutes—quick, seamless, and completely hassle-free.',
    icon: HiOutlineClock,
  },
  {
    title: 'Three Validity Tiers From $13',
    text: 'Pick the validity that fits how long you need proof of onward travel: 2 days for $13, 7 days for $20, or 14 days for $23. All tiers include the same verifiable PNR and instant email delivery.',
    icon: HiOutlineCurrencyDollar,
  },
];

const pageData = {
  meta: {
    title: 'Onward Ticket From USD 13 | Instant, Genuine, & Affordable',
    description:
      'Book a verifiable onward ticket for airline check-in or immigration from USD 13. Three validity tiers — 2 days ($13), 7 days ($20), 14 days ($23). Delivered in minutes.',
    canonical: 'https://www.dummyticket365.com/onward-ticket',
  },
  sections: {
    hero: {
      title: 'Book Your Onward Ticket From USD 13',
      subtitle:
        'Get onward tickets issued through global GDS platforms (Amadeus, Sabre, Travelport) with a valid, verifiable PNR. Legitimate bookings created for travel documentation purposes, not fake or falsified tickets.',
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
          icon: <MdOutlineHotel />,
          title: "Hotel Reservations",
          description: "Temporary hotel reservations formatted to embassy and consulate standards. Like onward tickets, these are real reservations — not paid bookings — so your visa file is complete without locking in non-refundable nights before approval.",
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
  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Onward Ticket' },
  ];

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
    // Inline Product node with AggregateOffer — onward tickets are priced
    // in three validity tiers ($13 / $20 / $23) and the shared buildProduct
    // helper only supports a single Offer. Mirrors buildProduct's shape
    // (Organization @id refs) so it integrates cleanly with the graph.
    {
      '@type': 'Product',
      '@id': `${pageData.meta.canonical}#product`,
      name: pageData.meta.title,
      description: pageData.meta.description,
      url: pageData.meta.canonical,
      brand: { '@id': `${SITE_URL}/#organization` },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '13.00',
        highPrice: '23.00',
        offerCount: 3,
        availability: 'https://schema.org/InStock',
        url: pageData.meta.canonical,
        seller: { '@id': `${SITE_URL}/#organization` },
      },
    },
    buildFAQPage({
      canonical: pageData.meta.canonical,
      title: pageData.sections.faqs.title,
      description: pageData.meta.description,
      faqs: pageData.sections.faqs.faqs,
    }),
    buildBreadcrumbList({ paths: breadcrumbPaths }),
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
          'Issued via global GDS platforms',
          'Valid, verifiable PNR',
          'Delivered in minutes',
        ]}
        breadcrumbPaths={breadcrumbPaths}
      />
      <QuickAnswer
        question="What counts as proof of onward travel?"
        answer="Proof of onward travel is a flight reservation showing you will leave the destination country within the permitted stay. Airlines and immigration officers accept a real reservation with a verifiable PNR. They do not require a paid ticket. Our onward ticket gives you exactly that, on global GDS platforms (Amadeus, Sabre, Travelport), in three validity tiers from $13."
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
      {/* Inline FAQ render — we pass 13 FAQs to schema, but the shared <FAQ>
          component caps the visible list to 6. Google's FAQPage rich result
          guidelines require the schema content to be visible on the page,
          so this section renders the full list to match the schema. */}
      <PrimarySection id="faq" className="py-14 md:py-18 lg:py-24 bg-gray-50/70">
        <Container>
          <SectionTitle
            textAlign="center"
            subtitle={pageData.sections.faqs.subtitle}
            className="mb-10 md:mb-12"
          >
            {pageData.sections.faqs.title}
          </SectionTitle>
          <div className="rounded-2xl border border-white bg-white p-4 md:p-7 shadow-[0_14px_35px_rgba(16,24,40,0.08)]">
            <div className="flex flex-col gap-1">
              {pageData.sections.faqs.faqs.map((faq, i) => (
                <FaqAccordion key={i} question={faq.question}>
                  {faq.answer}
                </FaqAccordion>
              ))}
            </div>
          </div>
        </Container>
      </PrimarySection>
      <BlogPosts
        title={pageData.sections.blogs.title}
        subtitle={pageData.sections.blogs.subtitle}
      />
      <RelatedPages
        title="Related Dummy Ticket Pages"
        subtitle="Country-specific options for visa applications"
        links={[
          { anchor: 'Dummy ticket for a Schengen visa', href: '/dummy-ticket-schengen-visa', blurb: 'EU Visa Code Article 14 compliant, accepted at VFS, BLS, and TLScontact.' },
          { anchor: 'Dummy ticket for a UK visa', href: '/dummy-ticket-uk-visa', blurb: 'Standard Visitor visa file ready, no paid ticket needed before approval.' },
          { anchor: 'Dummy ticket for a Canada visa', href: '/dummy-ticket-canada-visa', blurb: 'Aligned with IRCC guidance on flight bookings before approval.' },
          { anchor: 'Dummy ticket for an Australia visa', href: '/dummy-ticket-australia-visa', blurb: 'Formatted for the Subclass 600 ImmiAccount upload.' },
        ]}
      />
      <Contact email="info@dummyticket365.com" />
    </>
  );
}
