import Check from '../components/Check';
import Container from '../components/Container';

export default function LandingHero({ eyebrow, title, lede, promises = [], cta, href, from = 9 }) {
  return (
    <section className="hero hero--landing">
      <Container className="hero__inner hero__inner--single">
        <div className="hero__copy">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="display hero__title">{title}</h1>
          <p className="lede">{lede}</p>

          <div className="hero__actions">
            <a className="btn btn--primary" href={href}>
              {cta} <span className="btn__price">from ${from}</span>
            </a>
          </div>

          {promises.length > 0 && (
            <ul className="hero__promises">
              {promises.map((promise) => (
                <li className="hero__promise" key={promise}>
                  <Check />
                  <span>{promise}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
