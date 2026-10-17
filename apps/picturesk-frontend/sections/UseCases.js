import { useCases as defaultUseCases } from '../data/landing';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

export default function UseCases({
  eyebrow = "Who it's for",
  title = 'Headshots for LinkedIn, resumes, and your team.',
  lede = 'One set of professional headshots you control, ready for wherever you show up online.',
  useCases = defaultUseCases,
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
