import { useCases as defaultUseCases } from '../data/landing';
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
export default function UseCases({
  eyebrow = "Who it's for",
  title = 'Headshots for LinkedIn, resumes, and your team.',
  lede = 'One set of professional headshots you control, ready for wherever you show up online.',
  useCases = defaultUseCases,
  // 'featured' is the home layout: a wide lead panel plus seven tiles, which fills
  // the three-column grid exactly. Any other count leaves a hole, so a landing page
  // with four or five entries uses 'grid'.
  variant = 'featured',
}) {
  const [lead, ...rest] = useCases;
  const featured = variant === 'featured';

  return (
    <section className="section usecases">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />
        <ul className={`usecases__grid${featured ? '' : ' usecases__grid--even'}`}>
          {featured && (
            <li className={`usecase usecase--lead${lead.href ? ' usecase--link' : ''}`} key={lead.title}>
              <h3 className="usecase__title">
                {lead.href ? <a href={lead.href}>{lead.title}</a> : lead.title}
              </h3>
              <p className="usecase__body">{lead.body}</p>
            </li>
          )}
          {(featured ? rest : useCases).map((u) => (
            <li className={`usecase${u.href ? ' usecase--link' : ''}`} key={u.title}>
              <h3 className="usecase__title">
                {/* An entry with its own landing page links to it. This is how the
                    home page feeds equity to the vertical pages instead of being a
                    dead end. */}
                {u.href ? <a href={u.href}>{u.title}</a> : u.title}
              </h3>
              <p className="usecase__body">{u.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
