import Container from '../components/Container';
import Frame from '../components/Frame';
import SectionHeading from '../components/SectionHeading';

export default function BeforeAfter({ eyebrow, title, lede, before, after }) {
  return (
    <section className="section beforeafter">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />
        <div className="ba">
          <div className="ba__side">
            <p className="ba__label">What he uploaded</p>
            <div className="ba__grid ba__grid--before">
              {before.map((src) => (
                <Frame className="ba__shot" src={src} sizes="(max-width: 760px) 30vw, 14vw" key={src} />
              ))}
            </div>
          </div>
          <div className="ba__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="ba__side ba__side--after">
            <p className="ba__label">What he got back</p>
            <div className="ba__grid ba__grid--after">
              {after.map((src) => (
                <Frame className="ba__shot" src={src} sizes="(max-width: 760px) 44vw, 18vw" key={src} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
