'use client';

import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';

export default function FaqGroups({ groups }) {
  return (
    <div className="faqgroups">
      {groups.map((group) => (
        <section className="faqgroup" key={group.label}>
          <h2 className="faqgroup__title">{group.label}</h2>
          <div className="faq__list shared-ui">
            {group.items.map((item) => (
              <FaqAccordion key={item.q} question={item.q}>
                {item.a}
              </FaqAccordion>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
