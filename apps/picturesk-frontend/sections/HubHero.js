import { hubShots } from '../data/samples';
import Frame from '../components/Frame';
import Container from '../components/Container';

// The hub hero. Same shape as the product hero (eyebrow, verdict headline, the
// quick answer, the frame cluster), but the single action becomes two service
// cards: on a hub the one thing to do is pick a service. Copy comes from data/hub.js.
export default function HubHero({ eyebrow, title, lede, services = [] }) {
  return (
    <section className="hero hero--hub">
      <Container className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display hero__title">{title}</h1>
          <p className="lede">{lede}</p>

          <div className="hub-picks">
            {services.map((s) => (
              <a className="hub-pick" href={s.href} key={s.id}>
                <span className="hub-pick__title">{s.title}</span>
                <span className="hub-pick__who">{s.who}</span>
                <span className="hub-pick__cta">
                  Start <span className="hub-pick__price">from ${s.from}</span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="hero__gallery">
          {hubShots.map((shot, i) => (
            <Frame
              key={i}
              src={shot.src}
              alt={shot.src ? 'A Picturesk photo generated from selfies' : ''}
              placeholder={shot.placeholder}
              priority={Boolean(shot.src)}
              ratio={i === 0 ? 'portrait' : undefined}
              sizes={i === 0 ? '(max-width: 760px) 60vw, 28vw' : '(max-width: 760px) 40vw, 18vw'}
              className={`hero__frame hero__frame--${i + 1}`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
