'use client';

import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';
import { homeFaq } from '../data/faq';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';

// The FAQ, using the SAME shared accordion MDT and DT365 use
// (@travel-suite/frontend-shared ui/v1/FaqAccordion), so the interaction and the
// look stay identical across the brands. It is a Tailwind component and this site
// is plain CSS, so app/(site)/shared-ui.css compiles the handful of utilities it
// needs and maps `primary` to Picturesk's green; `.shared-ui` carries the few
// Preflight resets it assumes.
export default function Faq() {
  return (
    <section id="faq" className="section faq">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered."
          lede="The things people ask before they upload anything. If yours is not here, the contact page is one click away."
        />

        {/* One grouped, grey-bordered card, the way MDT and DT365 present theirs
            (frontend-shared sections/v2/Faqs), spanning the full container. */}
        <div className="faq__list shared-ui">
          {homeFaq.map((item) => (
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
