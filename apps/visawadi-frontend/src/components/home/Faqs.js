import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Accordion from "@/components/design-system/Accordion";
import { Section, SectionHeading } from "@/components/design-system/Shell";

export default function Faqs({ heading, description, faqs = [], allHref }) {
  if (!faqs.length) return null;

  return (
    <Section id="faqs" tone="canvas">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="FAQs"
            title={heading}
            description={description}
          />
          {allHref && (
            <Link
              href={allHref}
              className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Read all FAQs
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="rounded-panel border border-line bg-surface px-5 shadow-raised md:px-8">
          {faqs.map((faq, i) => (
            <Accordion
              key={faq.question}
              question={faq.question}
              defaultOpen={i === 0}
            >
              {faq.answer}
            </Accordion>
          ))}
        </div>
      </div>
    </Section>
  );
}
