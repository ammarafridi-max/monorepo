import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";
import VisaGuideLink from "./VisaGuideLink.js";
import FaqAccordion from "../../ui/v2/FaqAccordion.js";

export default function VisaFaqSection({ faqs = [], countryName, guide }) {
  if (!faqs.length) return null;
  const subject = countryName ? `${countryName} visa` : "visa";

  return (
    <section
      id="faq"
      className="py-12 md:py-16 bg-gray-50 border-y border-gray-100"
    >
      <Container>
        <SectionHead
          title={`${countryName ? `${countryName} Visa: ` : ""}Frequently Asked Questions`}
          subtitle={`Common questions about ${countryName} visas. If you don't see your question, get in touch and our specialists respond within minutes.`}
        />

        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_4px_rgba(16,24,40,0.04)] overflow-hidden">
          {faqs.map((faq, i) => (
            <FaqAccordion key={i} question={faq.question}>
              {faq.answer}
            </FaqAccordion>
          ))}
        </div>

        <VisaGuideLink guide={guide} label={`Read our complete ${subject} guide`} />
      </Container>
    </section>
  );
}
