import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';
import SectionHeading from './SectionHeading';

const DEFAULT_FAQS = [
  {
    q: `How far in advance should I book?`,
    a: `We recommend booking at least 24 hours before your flight to guarantee availability, especially during peak travel seasons. Last-minute bookings are often possible, but earlier is safer.`,
  },
  {
    q: `What happens if my flight is delayed?`,
    a: `Your driver tracks your flight in real time and adjusts pickup automatically. You won't be charged extra for reasonable delays.`,
  },
  {
    q: `Is the price really fixed?`,
    a: `Yes. The price you're quoted is the total you pay. No meters, no surge pricing, no hidden fees added at the end of your trip.`,
  },
  {
    q: `Can I cancel my booking?`,
    a: `Most bookings can be cancelled free of charge up to a set time before your pickup. The exact terms are shown clearly before you pay.`,
  },
  {
    q: `What if I can't find my driver?`,
    a: `Your booking includes your driver's contact details and clear pickup instructions. If anything goes wrong, our 24/7 support team will connect you right away.`,
  },
  {
    q: `Do you cover my city?`,
    a: `We're live in over 40 cities and adding more every week. Enter your airport above to check availability, or sign up to be notified when we launch near you.`,
  },
];

export default function FaqSection({
  eyebrow = 'Good to know',
  title = 'Common questions about airport transfers',
  subtitle = 'Everything you need to know before you book.',
  faqs = DEFAULT_FAQS,
}) {
  return (
    <section id="faq" className="scroll-mt-24 bg-sand-50 py-20 md:py-28">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="mt-10 overflow-hidden rounded-card bg-white p-2 ring-1 ring-sand-300/70 sm:p-4">
          {faqs.map(({ q, a }) => (
            <FaqAccordion key={q} question={q}>
              {a}
            </FaqAccordion>
          ))}
        </div>
      </Container>
    </section>
  );
}
