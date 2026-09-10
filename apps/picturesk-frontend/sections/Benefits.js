import { FiRotateCcw, FiSearch, FiTag, FiUser } from 'react-icons/fi';
import { benefits } from '../data/landing';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// Why us rather than the other AI headshot tools. Each point is a real difference
// in how the product is built (the upload gate, the per-customer trained model, the
// one-time charge, the automatic refund), so nothing here is a claim we cannot back.
//
// One line glyph per card, named by the `icon` key in data/landing.js so the copy
// file carries no component imports. Line icons, not filled ones, and never emoji.
const ICONS = {
  screen: FiSearch,
  face: FiUser,
  price: FiTag,
  refund: FiRotateCcw,
};

export default function Benefits() {
  return (
    <section id="why" className="section benefits">
      <Container>
        <SectionHeading
          eyebrow="Why Picturesk"
          title="Built so you never pay for a bad set."
          lede="Every AI headshot tool promises studio photos. The difference is what happens when your input is not perfect, when a run fails, and when the results land in your inbox."
        />

        <ul className="benefits__grid">
          {benefits.map((b) => {
            const Icon = ICONS[b.icon];
            return (
              <li className="benefit" key={b.title}>
                {Icon && (
                  <span className="benefit__icon" aria-hidden="true">
                    <Icon />
                  </span>
                )}
                <h3 className="benefit__title">{b.title}</h3>
                <p className="benefit__body">{b.body}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
