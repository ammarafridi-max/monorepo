import { FiRotateCcw, FiSearch, FiTag, FiUser } from 'react-icons/fi';
import { benefits as defaultBenefits } from '../data/landing';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

const ICONS = {
  screen: FiSearch,
  face: FiUser,
  price: FiTag,
  refund: FiRotateCcw,
};

export default function Benefits({
  eyebrow = 'Why Picturesk',
  title = 'Built so you never pay for a bad set.',
  lede = 'Every AI headshot tool promises studio photos. The difference is what happens when your input is not perfect, when a run fails, and when the results land in your inbox.',
  benefits = defaultBenefits,
}) {
  return (
    <section id="why" className="section benefits">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />

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
