import { steps as defaultSteps } from '../data/landing';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

export default function HowItWorks({
  eyebrow = 'The process',
  title = 'Three steps, about an hour.',
  lede = "No studio, no shoot, no waiting on a photographer's calendar. You upload, we train and generate, and the finished set lands in your inbox the same morning.",
  steps = defaultSteps,
}) {
  return (
    <section id="how" className="section how">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />

        <ol className="steps-grid">
          {steps.map((s, i) => (
            <li className="stepcard" key={s.title}>
              <div className="stepcard__head">
                <span className="stepcard__num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="stepcard__title">{s.title}</h3>
              <p className="stepcard__body">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
