import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import { ShieldCheck, Lock, Headphones } from 'lucide-react';

const DEFAULT_PILLARS = [
  {
    icon: ShieldCheck,
    title: `Vetted drivers`,
    text: `Every driver is screened and rated. We work with established local operators, not random pickups.`,
  },
  {
    icon: Lock,
    title: `Secure payment`,
    text: `Pay online through encrypted, secure checkout. Your card details are never shared with the driver.`,
  },
  {
    icon: Headphones,
    title: `Real support, any hour`,
    text: `Flight delayed at 3am? Driver running late? Our team is reachable around the clock, wherever you are.`,
  },
];

export default function TrustSection({
  eyebrow = 'Peace of mind',
  title = 'Booked with confidence',
  subtitle = 'The reassurance that comes from a service built around your trip.',
  pillars = DEFAULT_PILLARS,
}) {
  return (
    <section className="bg-ink py-20 text-sand-100 md:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-eyebrow font-semibold uppercase text-honey-400">{eyebrow}</span>
          <h2 className="mt-3 text-h2 font-semibold text-sand-50">{title}</h2>
          <p className="mt-3 text-lead font-light text-sand-100/70">{subtitle}</p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title: pillarTitle, text }) => (
            <div key={pillarTitle} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-pill bg-clay-600 text-white ring-8 ring-white/5">
                <Icon size={24} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-sand-50">{pillarTitle}</h3>
              <p className="mt-2 text-[15px] font-light leading-relaxed text-sand-100/70">{text}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 flex max-w-2xl flex-col items-center gap-2 rounded-card border border-dashed border-white/15 px-6 py-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-sand-100/40">
            Placeholder
          </span>
          <p className="text-sm text-sand-100/60">
            Review and rating logos (Trustpilot, Google reviews, star ratings) go here once
            available.
          </p>
        </div>
      </Container>
    </section>
  );
}
