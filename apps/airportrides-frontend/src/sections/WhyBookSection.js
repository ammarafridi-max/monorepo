import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionHeading from './SectionHeading';
import { Lock, PlaneLanding, Languages, Car } from 'lucide-react';

const DEFAULT_ITEMS = [
  {
    icon: Lock,
    title: `Fixed price, locked in`,
    text: `The price you see is the price you pay. No meters, no surge pricing, no "the traffic was bad" surcharges at the end.`,
  },
  {
    icon: PlaneLanding,
    title: `Your driver knows your flight`,
    text: `We track your arrival. Land early or late, your driver adjusts. You'll never pay for their waiting time.`,
  },
  {
    icon: Languages,
    title: `No language barriers`,
    text: `Drivers are briefed with your details in advance. No explaining your hotel address to someone who doesn't speak your language at midnight.`,
  },
  {
    icon: Car,
    title: `Skip the airport taxi line`,
    text: `Walk past the queue. Your driver is waiting at arrivals with your name, ready to go.`,
  },
];

export default function WhyBookSection({
  eyebrow = 'Worth the two minutes',
  title = 'Why travelers book their ride before they fly',
  subtitle = 'A little planning turns the most stressful part of any trip into the easiest.',
  items = DEFAULT_ITEMS,
}) {
  return (
    <section id="why" className="scroll-mt-24 bg-sand-200 py-20 md:py-28">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {items.map(({ icon: Icon, title: cardTitle, text }, i) => (
            <div
              key={cardTitle}
              className={`rounded-card bg-sand-50 p-7 ring-1 ring-sand-300/70 transition-shadow duration-300 hover:shadow-warm-sm ${
                i % 2 === 1 ? 'lg:mt-10' : ''
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-100 text-clay-700">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-ink">{cardTitle}</h3>
              <p className="mt-2 text-[15px] font-light leading-relaxed text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
