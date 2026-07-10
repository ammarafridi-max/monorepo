import { price, included } from '../data/landing';
import Check from './Check';

// Pricing: one clear card, one price, one action back to the uploader. Verdict
// first (the number), then what is included, then the CTA.
export default function Pricing() {
  return (
    <section id="pricing" className="section pricing">
      <div className="container">
        <p className="eyebrow">Pricing</p>
        <h2 className="h2">One price. No subscription.</h2>

        <div className="pricecard">
          <div className="pricecard__head">
            <span className="pricecard__amount">{price.amount}</span>
            <span className="pricecard__cadence">{price.cadence}</span>
          </div>
          <p className="pricecard__note">{price.note}</p>

          <ul className="checklist checklist--tight">
            {included.map((item) => (
              <li className="checklist__item" key={item}>
                <Check />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a className="btn btn--primary btn--block" href="/generator/select">
            Get my headshots <span className="btn__price">$35</span>
          </a>
          <p className="pricecard__fine">
            You pay on Stripe. Refunded automatically if a run fails. See our{' '}
            <a href="/terms">Terms</a> and <a href="/refunds">Refund Policy</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
