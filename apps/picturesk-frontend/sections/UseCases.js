import { useCases } from '../data/landing';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// Who it's for: a scannable grid of concrete use cases. Each captures a real search
// intent (LinkedIn, resumes, team pages, and more) and helps a visitor self-identify.
//
// The FIRST entry leads the grid as a wide green panel: it is the reason most people
// buy, and giving it the same solid-green treatment as the popular pricing plan gives
// the section a focal point instead of eight identical tiles. Eight entries fill the
// three-column grid exactly (the lead spans two columns), so the grid never has a
// hole in it. Data-driven from data/landing.js; no filler, in keeping with BRAND.md.
export default function UseCases() {
  const [lead, ...rest] = useCases;

  return (
    <section className="section usecases">
      <Container>
        <SectionHeading
          eyebrow="Who it's for"
          title="Headshots for LinkedIn, resumes, and your team."
          lede="One set of professional headshots you control, ready for wherever you show up online."
        />
        <ul className="usecases__grid">
          <li className="usecase usecase--lead" key={lead.title}>
            <h3 className="usecase__title">{lead.title}</h3>
            <p className="usecase__body">{lead.body}</p>
          </li>
          {rest.map((u) => (
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
