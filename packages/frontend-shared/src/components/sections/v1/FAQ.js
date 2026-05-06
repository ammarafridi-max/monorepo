import SectionTitle from '../../shared/layout/SectionTitle';
import PrimarySection from '../../shared/layout/PrimarySection';
import Container from '../../shared/layout/Container';
import FaqAccordion from '../../ui/v1/FaqAccordion';
import PrimaryLink from '../../ui/v1/PrimaryLink';

export default function FAQ({
  title = 'Frequently Asked Questions',
  subtitle = 'Common questions answered',
  faqs,
}) {
  return (
    <PrimarySection id="faq" className="py-14 md:py-18 lg:py-24 bg-gray-50/70">
      <Container>
        <SectionTitle textAlign="center" subtitle={subtitle} className="mb-10 md:mb-12">
          {title}
        </SectionTitle>
        <div className="rounded-2xl border border-white bg-white p-4 md:p-7 shadow-[0_14px_35px_rgba(16,24,40,0.08)]">
          <div className="flex flex-col gap-1">
          {faqs?.slice(0, 6).map((faq, i) => (
            <FaqAccordion key={i} question={faq.question}>
              {faq.answer}
            </FaqAccordion>
          ))}
          </div>
        </div>
        <div className="flex items-center justify-center mt-10">
          <PrimaryLink size="small" to="/faq">
            Read More FAQs
          </PrimaryLink>
        </div>
      </Container>
    </PrimarySection>
  );
}
