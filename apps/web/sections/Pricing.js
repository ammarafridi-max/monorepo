import { TIERS } from '@picturesk/shared/pricing';
import { included } from '../data/landing';
import Check from '../components/Check';
import Container from '../components/Container';

// Whole-dollar price from integer cents (tier prices are round dollars).
const usd = (cents) => `$${Math.round(cents / 100)}`;
// One line of "what changes" per tier: count first (verdict), then turnaround.
const TURNAROUND = { starter: 'Standard queue', pro: 'Priority queue', premium: 'Front of the queue' };

// Pricing: three one-time plans, then the shared inclusions, then ONE action into
// the funnel (the plan is confirmed on the pay step). Verdict first (the price),
// buy action singular and obvious.
export default function Pricing() {
  return (
    <section id="pricing" className="section pricing">
      <Container>
        <p className="eyebrow">Pricing</p>
        <h2 className="h2">Three plans. One time.</h2>

        <div className="plans">
          {TIERS.map((t) => (
            <div className={`plan${t.popular ? ' plan--on' : ''}`} key={t.id}>
              {t.popular && <span className="plan__badge">Most popular</span>}
              <span className="plan__name">{t.label}</span>
              <span className="plan__price">{usd(t.priceCents)}</span>
              <span className="plan__meta">{t.deliverCount} headshots</span>
              <span className="plan__meta">{TURNAROUND[t.id]}</span>
            </div>
          ))}
        </div>

        <ul className="checklist checklist--tight">
          {included.map((item) => (
            <li className="checklist__item" key={item}>
              <Check />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <a className="btn btn--primary btn--block" href="/generator/select">
          Get my headshots <span className="btn__price">from $29</span>
        </a>
        <p className="pricecard__fine">
          You pay on Stripe. Refunded automatically if a run fails. See our{' '}
          <a href="/terms">Terms</a> and <a href="/refunds">Refund Policy</a>.
        </p>
      </Container>
    </section>
  );
}
