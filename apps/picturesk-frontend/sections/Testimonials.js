import { FaStar } from 'react-icons/fa6';
import { testimonials } from '../data/landing';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// What customers say, three cards across. The rating comes from the data rather
// than being a hardcoded five, so a four-star quote can be shown honestly.
//
// NOTE: data/landing.js currently holds PLACEHOLDER quotes and ratings from
// invented people so this section can be designed. They must be swapped for real,
// attributable quotes before launch.
function Stars({ rating = 5 }) {
  return (
    <span className="quote__stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: rating }, (_, i) => (
        <FaStar key={i} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="section testimonials">
      <Container>
        <SectionHeading
          eyebrow="Testimonials"
          title="What people say about their set."
          lede="The test is not whether the photos look good. It is whether the people who know you think they look like you."
        />

        <ul className="quotes">
          {testimonials.map((t) => (
            <li className="quote" key={t.name}>
              <Stars rating={t.rating} />
              <blockquote className="quote__text">{t.quote}</blockquote>
              <div className="quote__who">
                <span className="quote__avatar" aria-hidden="true">
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="quote__name">{t.name}</span>
                  <span className="quote__role">{t.role}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
