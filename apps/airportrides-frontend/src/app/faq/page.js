import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';
import PageHero from '@/sections/PageHero';
import { buildBreadcrumbList } from '@travel-suite/frontend-shared/utils/breadcrumb';
import { SITE_URL } from '@/config';

export const metadata = {
  title: 'Frequently Asked Questions – AirportRides',
  description:
    'Answers to the most common questions about booking airport transfers — pricing, cancellations, flight tracking, vehicle types, and more.',
  alternates: { canonical: `${SITE_URL}/faq` },
};

const paths = [
  { label: 'Home', path: '/' },
  { label: 'FAQ', path: '/faq' },
];

const faqs = [
  {
    category: 'Booking',
    q: 'How do I book an airport transfer?',
    a: 'Enter your pick-up airport or address, your destination, travel date, and number of passengers. You\'ll see a fixed price instantly — no quote requests, no waiting. Confirm and pay, and your booking is done in under two minutes.',
  },
  {
    category: 'Booking',
    q: 'How far in advance should I book?',
    a: 'We recommend booking at least 24 hours before your flight to guarantee availability, especially during peak travel seasons. Last-minute bookings are often possible for major airports, but earlier is always safer.',
  },
  {
    category: 'Booking',
    q: 'Can I book for someone else?',
    a: 'Yes. You can book a transfer for another passenger. Simply enter the traveller\'s contact details at checkout so the driver can reach them directly on the day.',
  },
  {
    category: 'Pricing',
    q: 'Is the price really fixed?',
    a: 'Absolutely. The price you see is the total you pay — no meters, no surge pricing, no fuel surcharges, no hidden fees added at the end of your journey.',
  },
  {
    category: 'Pricing',
    q: 'What\'s included in the price?',
    a: 'Your fixed price includes the driver, vehicle, all applicable tolls and fees, and meet-and-greet service for airport arrivals. Any optional extras (child seats, additional stops) are shown clearly before payment.',
  },
  {
    category: 'Pricing',
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. Apple Pay and Google Pay are also accepted on supported devices.',
  },
  {
    category: 'Flight tracking',
    q: 'What happens if my flight is delayed?',
    a: 'Your driver tracks your flight in real time and automatically adjusts the pick-up time. For delays of up to 60 minutes, no action is needed and there\'s no extra charge. For longer delays, simply message us and we\'ll coordinate with your driver.',
  },
  {
    category: 'Flight tracking',
    q: 'Do you monitor early arrivals too?',
    a: 'Yes. If your flight lands ahead of schedule, we\'ll notify your driver and do our best to have them ready. For very early arrivals there may be a short wait, but your driver will be on the way.',
  },
  {
    category: 'Cancellations & refunds',
    q: 'Can I cancel my booking?',
    a: 'Yes. Free cancellation is available up to 24 hours before your scheduled pick-up. Cancellations within 24 hours may incur a fee, depending on the operator. Full details are shown before you pay.',
  },
  {
    category: 'Cancellations & refunds',
    q: 'What if I miss my transfer?',
    a: 'If you miss your pick-up without contacting us, the booking is considered a no-show and is non-refundable. If you\'re running late, call or message your driver — most operators can wait a reasonable amount of time.',
  },
  {
    category: 'On the day',
    q: 'Where will my driver meet me?',
    a: 'For airport arrivals, your driver will be in the arrivals hall holding a name board with your name. Exact meet-point instructions are in your booking confirmation email.',
  },
  {
    category: 'On the day',
    q: 'What if I can\'t find my driver?',
    a: 'Your confirmation includes your driver\'s direct phone number. If you still can\'t locate them, contact our 24/7 support team and we\'ll connect you immediately.',
  },
  {
    category: 'On the day',
    q: 'Can I add extra stops to my journey?',
    a: 'Additional stops can be requested at the time of booking. Adding stops mid-journey is subject to the driver\'s availability and may incur an extra charge agreed directly with the driver.',
  },
  {
    category: 'Vehicles',
    q: 'What types of vehicles are available?',
    a: 'We offer a range of vehicles to suit every trip — standard saloons and sedans for solo travellers, MPVs and minivans for families or small groups, and executive/premium vehicles for business travel. All vehicle options are shown at booking with their included luggage capacity.',
  },
  {
    category: 'Vehicles',
    q: 'Are child seats available?',
    a: 'Child seats and booster seats can be requested as an add-on during the booking process, subject to availability. Please book as early as possible to guarantee this option.',
  },
  {
    category: 'Coverage',
    q: 'Which cities and airports do you cover?',
    a: 'We currently operate in 40+ cities across the Middle East, Europe, and Asia, including Dubai, Abu Dhabi, London, Istanbul, Paris, Bangkok, and Barcelona. Enter your airport in the booking form to check live availability.',
  },
  {
    category: 'Coverage',
    q: 'Is AirportRides available for hotel or cruise port pickups?',
    a: 'Yes. While airport transfers are our specialty, you can also book point-to-point transfers between hotels, cruise ports, train stations, and private addresses.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const grouped = faqs.reduce((acc, faq) => {
  (acc[faq.category] ??= []).push(faq);
  return acc;
}, {});

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PageHero
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about booking, pricing, flight tracking, and what to expect on the day of your transfer."
        paths={paths}
      />

      <section className="py-16 md:py-20">
        <Container>
          <div className="max-w-3xl mx-auto flex flex-col gap-14">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h2 className="font-display text-xl font-semibold text-ink mb-6 pb-3 border-b border-sand-300">
                  {category}
                </h2>
                <div className="flex flex-col gap-3">
                  {items.map((faq, i) => (
                    <FaqAccordion key={i} question={faq.q}>
                      {faq.a}
                    </FaqAccordion>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12 bg-sand-100 border-t border-sand-200">
        <Container>
          <div className="max-w-xl mx-auto text-center">
            <p className="text-ink-soft mb-4">Still have questions?</p>
            <a
              href="/contact"
              className="inline-block rounded-pill bg-clay-600 px-7 py-3 text-sm font-semibold text-white hover:bg-clay-700 transition-colors"
            >
              Contact us
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
