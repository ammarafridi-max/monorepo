import { TIERS } from '@travel-suite/picturesk-shared/pricing';
import { planNotes } from '../data/landing';
import Check from '../components/Check';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// Whole-dollar price from integer cents (tier prices are round dollars).
const usd = (cents) => `$${Math.round(cents / 100)}`;

const TURNAROUND = { starter: 'Standard queue', pro: 'Priority queue', premium: 'Front of the queue' };

// What a plan includes, as a checklist built from the tier data itself, so the
// counts on the card can never drift from what the funnel actually sells. A null
// count means the tier unlocks the whole catalogue.
const optionLabel = (n, noun) =>
  n == null ? `All ${noun} options` : `${n} ${noun} option${n === 1 ? '' : 's'}`;

const includesFor = (tier) => [
  `${tier.deliverCount} headshots`,
  optionLabel(tier.attireCount, 'outfit'),
  optionLabel(tier.lookCount, 'background'),
  TURNAROUND[tier.id],
];

// Pricing: three one-time plans, each showing what it includes, who it is for, and
// the one place it runs out, then ONE action into the funnel. Verdict first (the
// price), buy action singular and obvious.
export default function Pricing() {
  return (
    <section id="pricing" className="section pricing">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Three plans. One time."
          lede="Every plan trains a model on your own face and delivers at full resolution. What changes is how many headshots you get and how much of the catalogue you can pick from."
        />

        <div className="plans">
          {TIERS.map((t) => {
            const notes = planNotes[t.id] ?? {};
            return (
              <div className={`plan${t.popular ? ' plan--on' : ''}`} key={t.id}>
                {t.popular && <span className="plan__badge">Most popular</span>}
                <span className="plan__name">{t.label}</span>
                <span className="plan__price">{usd(t.priceCents)}</span>

                <ul className="plan__includes">
                  {includesFor(t).map((item) => (
                    <li className="plan__include" key={item}>
                      <Check />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {notes.best && <p className="plan__best">{notes.best}</p>}

                {notes.cons?.length > 0 && (
                  <ul className="plan__limits">
                    {notes.cons.map((con) => (
                      <li className="plan__limit" key={con}>
                        <span className="plan__dash" aria-hidden="true" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <a className="btn btn--primary btn--block" href="/ai-headshot-generator/select">
          Get my headshots <span className="btn__price">from $9</span>
        </a>
        <p className="pricecard__fine">
          You pay on Stripe. Refunded automatically if a run fails. See our{' '}
          <a href="/terms">Terms</a> and <a href="/refunds">Refund Policy</a>.
        </p>
      </Container>
    </section>
  );
}
