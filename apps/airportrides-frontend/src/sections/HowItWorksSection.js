import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionHeading from './SectionHeading';
import { Search, CreditCard, Car } from 'lucide-react';

const DEFAULT_STEPS = [
  {
    n: '01',
    icon: Search,
    title: `Tell us where you're going`,
    text: `Enter your airport and destination. We check trusted local drivers and show you a fixed price upfront.`,
  },
  {
    n: '02',
    icon: CreditCard,
    title: `Book in two minutes`,
    text: `Confirm your details and pay securely. You get instant confirmation and your driver's details before your trip.`,
  },
  {
    n: '03',
    icon: Car,
    title: `Get picked up, stress-free`,
    text: `Your driver tracks your flight and waits for you, even if you land late. No queues, no haggling, no meter anxiety.`,
  },
];

export default function HowItWorksSection({
  eyebrow = 'The easy part',
  title = 'How it works',
  subtitle = 'Three steps from landing to your destination.',
  steps = DEFAULT_STEPS,
}) {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-sand-50 py-20 md:py-28">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-7 hidden border-t-2 border-dashed border-clay-200 md:block"
          />

          {steps.map(({ n, icon: Icon, title: stepTitle, text }) => (
            <div key={n} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-pill bg-clay-600 text-white shadow-warm-sm ring-8 ring-sand-50">
                <Icon size={24} />
              </div>
              <div className="mt-6 text-5xl font-semibold leading-none text-sand-300">
                {n}
              </div>
              <h3 className="mt-3 text-xl font-semibold text-ink">{stepTitle}</h3>
              <p className="mx-auto mt-2 max-w-xs text-[15px] font-light leading-relaxed text-ink-soft">
                {text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
