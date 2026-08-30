import { samples } from '../data/samples';
import Frame from '../components/Frame';
import Container from '../components/Container';

// Hero: the thesis. Serif verdict headline, one primary action that scrolls to
// the uploader, and a small cluster of real result frames so photos are loud from
// the first screen. The cluster pulls from the first sample set, so once real R2
// URLs land in data/samples.js the hero fills in with no markup change.
export default function Hero() {
  const showcase = (samples[0]?.after ?? []).slice(0, 3);
  const frames = showcase.length ? showcase : ['', '', ''];

  return (
    <section className="hero">
      <Container className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">A photo studio in your browser</p>
          <h1 className="display hero__title">
            Headshots that don&apos;t look AI.
          </h1>
          <p className="lede">
            Upload a few selfies. We train a model on your face and send back studio
            headshots you would actually put on LinkedIn.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="/ai-headshot-generator/select">
              Get my headshots <span className="btn__price">from $9</span>
            </a>
            <a className="btn btn--link" href="#work">
              See real results
            </a>
          </div>
          <p className="hero__guarantee">Look-like-you guarantee, or your money back.</p>
          <p className="hero__meta">
            Three one-time plans, from nine dollars. Delivered by email in about an hour.
          </p>
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
