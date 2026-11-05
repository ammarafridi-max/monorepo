import { Section, SectionHeading } from "@/components/design-system/Shell";

export default function WhyVisaWadi({ heading, description, intro, items = [] }) {
  return (
    <Section tone="canvas">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Why VisaWadi"
            title={heading}
            description={description}
          />
          {intro && (
            <p className="mt-5 max-w-xl text-meta leading-7 text-ink-body">
              {intro}
            </p>
          )}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="rounded-card border border-line bg-surface p-7 shadow-raised transition-colors hover:border-brand-200"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Icon size={19} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-[1.0625rem] font-semibold leading-snug text-ink">
                {title}
              </h3>
              <p className="mt-2.5 text-meta leading-6 text-ink-body">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
