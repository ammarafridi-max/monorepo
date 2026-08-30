import { useCases } from '../data/landing';
import Container from '../components/Container';

// Who it's for: a scannable grid of concrete use cases. Each captures a real search
// intent (LinkedIn, resumes, team pages, and more) and helps a visitor self-identify.
// Data-driven from data/landing.js; no filler, in keeping with BRAND.md.
export default function UseCases() {
  return (
    <section className="section usecases">
      <Container>
        <p className="eyebrow">Who it&apos;s for</p>
        <h2 className="h2">Headshots for LinkedIn, resumes, and your team.</h2>
        <p className="section__lede">
          One set of professional headshots you control, ready for wherever you show up
          online.
        </p>
        <ul className="usecases__grid">
          {useCases.map((u) => (
            <li className="usecase" key={u.title}>
              <h3 className="usecase__title">{u.title}</h3>
              <p className="usecase__body">{u.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
