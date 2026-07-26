import { included, looks } from '../data/landing';
import Check from '../components/Check';
import Container from '../components/Container';

// What you get: concrete, verdict-first specifics. Left column is the deliverable
// checklist, right column names every look so the value is legible at a glance.
export default function WhatYouGet() {
  return (
    <section className="section get">
      <Container>
        <p className="eyebrow">What you get</p>
        <h2 className="h2">Finished headshots, ready to use.</h2>
        <p className="section__lede">
          One upload, a set of distinct professional looks. No shoot, no studio, no
          waiting on a photographer.
        </p>

        <div className="get__cols">
          <ul className="checklist">
            {included.map((item) => (
              <li className="checklist__item" key={item}>
                <Check />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="looks">
            <p className="looks__label">The looks</p>
            <ul className="looks__list">
              {looks.map((look) => (
                <li className="tag" key={look}>
                  {look}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
