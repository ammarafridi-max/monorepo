import { samples } from '../data/samples';
import Frame from '../components/Frame';
import Container from '../components/Container';

// The results showcase: the loudest section on the page, built as a photography
// studio's portfolio. Each sample shows the ordinary selfies it started from
// (a small filmstrip) resolving into a wall of studio prints. Data-driven from
// data/samples.js so new identities are pure content edits.
export default function Showcase() {
  return (
    <section id="work" className="section showcase">
      <Container>
        <p className="eyebrow">The work</p>
        <h2 className="h2">Real headshots, from real selfies.</h2>
        <p className="section__lede">
          Every set below started as a handful of ordinary phone selfies. Same
          person, turned into a studio shoot.
        </p>

        <div className="samples">
          {samples.map((s) => (
            <article className="sample" key={s.name}>
              <div className="sample__before">
                <p className="sample__label">From these selfies</p>
                <div className="filmstrip">
                  {s.before.map((src, i) => (
                    <Frame
                      key={i}
                      src={src}
                      alt={`${s.name} selfie ${i + 1}`}
                      className="filmstrip__shot"
                    />
                  ))}
                </div>
                <p className="sample__who">
                  <span className="sample__name">{s.name}</span>
                  {s.role ? `, ${s.role}` : ''}
                </p>
              </div>

              <div className="sample__after">
                {s.after.map((src, i) => (
                  <Frame
                    key={i}
                    src={src}
                    alt={`${s.name} headshot ${i + 1}`}
                    className="sample__shot"
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
