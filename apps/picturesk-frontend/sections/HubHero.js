import { hubShots } from '../data/samples';
import Frame from '../components/Frame';
import Check from '../components/Check';
import Container from '../components/Container';
import GetStartedButton from '../components/GetStartedButton';

// The hub hero. Same shape as the product hero (eyebrow, verdict headline, the
// quick answer, one action, ticked promises, the frame cluster). The action opens
// the service picker, since on a hub the one thing to do is pick a service.
export default function HubHero({ eyebrow, title, lede, promises = [] }) {
  return (
    <section className="hero hero--hub">
      <Container className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display hero__title">{title}</h1>
          <p className="lede">{lede}</p>

          <div className="hero__actions">
            <GetStartedButton />
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
