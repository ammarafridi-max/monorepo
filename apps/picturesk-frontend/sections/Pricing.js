import { tiersFor, fromPriceFor, isFreeTier } from '@travel-suite/picturesk-shared/pricing';
import { planNotes } from '../data/landing';
import Check from '../components/Check';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// Whole-dollar price from integer cents (tier prices are round dollars).
const usd = (cents) => `$${Math.round(cents / 100)}`;

const TURNAROUND = { 3: 'Standard queue', 2: 'Priority queue', 1: 'Front of the queue' };
const NOUN = { headshots: 'headshots', dating: 'photos' };
const LOOK_NOUN = { headshots: 'background', dating: 'scene' };

// What a plan includes, as a checklist built from the tier data itself, so the
// counts on the card can never drift from what the funnel actually sells. A null
// count means the tier unlocks the whole catalogue.
const optionLabel = (n, noun) =>
  n == null ? `All ${noun} options` : `${n} ${noun} option${n === 1 ? '' : 's'}`;

const includesFor = (tier) => [
  `${tier.deliverCount} ${NOUN[tier.product]}`,
  optionLabel(tier.attireCount, 'outfit'),
  optionLabel(tier.lookCount, LOOK_NOUN[tier.product]),
  TURNAROUND[tier.priority],
];

// Pricing: three one-time plans, each showing what it includes, who it is for, and
// the one place it runs out, then ONE action into the funnel. Verdict first (the
// price), buy action singular and obvious.
export default function Pricing({
  eyebrow = 'Pricing',
  title = 'Three plans. One time.',
  lede = 'Every plan trains a model on your own face and delivers at full resolution. What changes is how many headshots you get and how much of the catalogue you can pick from.',
  cta = 'Get my headshots',
  product = 'headshots',
  href = '/ai-headshot-generator/about',
}) {
  const tiers = tiersFor(product);
  const from = fromPriceFor(product);
  return (
    <section id={product === 'headshots' ? 'pricing' : `pricing-${product}`} className="section pricing">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />

        <div className="plans">
          {tiers.map((t) => {
            const notes = planNotes[t.id] ?? {};
            return (
              <a
                className={`plan plan--link${t.popular ? ' plan--on' : ''}`}
                href={`/ai-headshot-generator/about?tier=${t.id}`}
                key={t.id}
                aria-label={`Choose ${t.label}, ${usd(t.priceCents)}`}
              >
                {t.popular && <span className="plan__badge">Most popular</span>}
                {isFreeTier(t) && <span className="plan__badge plan__badge--free">Once per account</span>}
                <span className="plan__name">{t.label}</span>
                <span className="plan__price">{isFreeTier(t) ? '$0' : usd(t.priceCents)}</span>

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
              </a>
            );
          })}
        </div>

        <a className="btn btn--primary btn--block" href={href}>
          {cta} <span className="btn__price">from ${from}</span>
        </a>
        <p className="pricecard__fine">
          You pay on Stripe. Refunded automatically if a run fails, and refunded in full if the
          set does not look like you (tell us within 3 days). See our <a href="/terms">Terms</a>{' '}
          and <a href="/refunds">Refund Policy</a>.
        </p>
      </Container>
    </section>
  );
}
