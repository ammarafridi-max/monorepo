'use client';

import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';
import { homeFaq } from '../data/faq';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

export default function Faq({
  eyebrow = 'FAQ',
  title = 'Questions, answered.',
  lede = 'The things people ask before they upload anything. If yours is not here, the contact page is one click away.',
  faqs = homeFaq,
}) {
  return (
    <section id="faq" className="section faq">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />

        <div className="faq__list shared-ui">
          {faqs.map((item) => (
            <FaqAccordion key={item.q} question={item.q}>
              {item.a}
            </FaqAccordion>
          ))}
        </div>

        <p className="faq__more">
          <a href="/faq">See all questions</a>
        </p>
      </Container>
    </section>
  );
}
