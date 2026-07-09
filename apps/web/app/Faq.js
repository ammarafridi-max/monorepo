import { faq } from '../data/faq';

// FAQ: native details/summary, so answers live in the DOM (good for AI citation
// and for no-JS), and each item is keyboard accessible for free. Content is
// data-driven from data/faq.js.
export default function Faq() {
  return (
    <section id="faq" className="section faq">
      <div className="container">
        <p className="eyebrow">FAQ</p>
        <h2 className="h2">Questions, answered.</h2>

        <div className="faq__list">
          {faq.map((item) => (
            <details className="qa" key={item.q}>
              <summary className="qa__q">
                {item.q}
                <span className="qa__mark" aria-hidden="true" />
              </summary>
              <p className="qa__a">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
