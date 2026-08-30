import { steps } from '../data/landing';
import Container from '../components/Container';

// How it works: a real three-step sequence, so numbered markers (01/02/03)
// genuinely encode order. Calm, no icons, no emoji.
export default function HowItWorks() {
  return (
    <section id="how" className="section how">
      <Container>
        <p className="eyebrow">How it works</p>
        <h2 className="h2">Three steps, about an hour.</h2>

        <ol className="steps-grid">
          {steps.map((s, i) => (
            <li className="stepcard" key={s.title}>
              <span className="stepcard__num">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="stepcard__title">{s.title}</h3>
              <p className="stepcard__body">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
