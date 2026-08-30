'use client';

import { useState } from 'react';
import { faq } from '../data/faq';
import Container from '../components/Container';

// FAQ accordion. Every answer is ALWAYS rendered in the DOM (not conditionally
// mounted) and collapsed with CSS (grid-rows 0fr -> 1fr on open), so the full answer
// text is in the server HTML for SEO / word count / AI citation while staying tidy.
// Toggling is client state; keyboard + aria-expanded make it accessible.
export default function Faq() {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (i) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section id="faq" className="section faq">
      <Container>
        <p className="eyebrow">FAQ</p>
        <h2 className="h2">Questions, answered.</h2>

        <div className="faq__list">
          {faq.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <div className={`qa${isOpen ? ' qa--open' : ''}`} key={item.q}>
                <button
                  type="button"
                  className="qa__q"
                  aria-expanded={isOpen}
                  onClick={() => toggle(i)}
                >
                  {item.q}
                  <span className="qa__mark" aria-hidden="true" />
                </button>
                <div className="qa__panel">
                  <p className="qa__a">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="faq__more">
          <a href="/faq">See all questions</a>
        </p>
      </Container>
    </section>
  );
}
