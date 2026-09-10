import { samples } from '../data/samples';
import Frame from '../components/Frame';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// The results showcase: the loudest section on the page, built as a photography
// studio's portfolio. Each sample is a real scenario, showing the ordinary selfies
// it started from (a small filmstrip), what the person needed the set for, and the
// wall of studio prints they got back. Data-driven from data/samples.js so new
// identities are pure content edits.
export default function Showcase() {
  return (
    <section id="work" className="section showcase">
      <Container>
        <SectionHeading
          eyebrow="The work"
          title="Real people, real selfies, real sets."
          lede="Every set below started as ordinary phone selfies that were never meant to be headshots. Same person, same face, photographed properly."
        />

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

                {s.scenario && <p className="sample__scenario">{s.scenario}</p>}
                {s.story && <p className="sample__story">{s.story}</p>}
                {s.used && (
                  <p className="sample__used">
                    <span className="sample__usedlabel">Used for</span> {s.used}
                  </p>
                )}
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
