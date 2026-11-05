import { Section, SectionHeading } from "@/components/design-system/Shell";

export default function HowItWorks({ heading, description, steps = [] }) {
  if (!steps.length) return null;

  return (
    <Section id="how-it-works" tone="surface">
      <SectionHeading
        align="center"
        eyebrow="How it works"
        title={heading}
        description={description}
      />

      <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-5 md:flex-col md:gap-0">
            <div className="flex shrink-0 flex-col items-center md:flex-row md:items-center md:gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 font-mono text-[0.9375rem] font-semibold text-brand-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="mt-2 w-px flex-1 bg-line md:mt-0 md:h-px md:w-full"
                />
              )}
            </div>

            <div className="pb-2 md:pt-6">
              <h3 className="text-card font-semibold text-ink">{step.title}</h3>
              <p className="mt-2.5 text-meta leading-7 text-ink-body">
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
