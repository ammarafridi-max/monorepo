import { heroShots } from '../data/samples';
import Frame from '../components/Frame';
import Check from '../components/Check';
import Container from '../components/Container';

// Hero: the thesis. A verdict headline, a quick-answer paragraph that states
// plainly what the product does (the thing a first-time visitor and an AI summary
// both need), one primary action, and the promises as a short ticked list. The
// frame cluster is its own set in data/samples.js (heroShots), picked so the hero
// and the portfolio below never show the same photo twice.
const PROMISES = [
  'Look-like-you guarantee, or your money back',
  'Three one-time plans, from nine dollars',
  'Delivered by email in about an hour',
];

export default function Hero() {
  const frames = heroShots.length ? heroShots.slice(0, 3) : ['', '', ''];

  return (
    <section className="hero">
      <Container className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">AI Headshot Generator</p>
          <h1 className="display hero__title">
            Headshots that don&apos;t look AI.
          </h1>
          <p className="lede">
            Picturesk is an AI headshot generator. Upload five to fifteen selfies, choose
            the backgrounds and outfits you want, and pay once. We train a model on your
            own face, generate a set of professional headshots across those looks, and
            email them to you in about an hour. No studio, no photographer, no
            subscription.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="/ai-headshot-generator/select">
              Get my headshots <span className="btn__price">from $9</span>
            </a>
          </div>
          <ul className="hero__promises">
            {PROMISES.map((promise) => (
              <li className="hero__promise" key={promise}>
                <Check />
                <span>{promise}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__gallery">
          {frames.map((src, i) => (
            <Frame key={i} src={src} alt="" className={`hero__frame hero__frame--${i + 1}`} />
          ))}
        </div>
      </Container>
    </section>
  );
}
