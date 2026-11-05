import { Star } from "lucide-react";
import { Section, SectionHeading } from "@/components/design-system/Shell";

function Stars({ rating }) {
  const count = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={14}
          aria-hidden="true"
          fill="currentColor"
          className="text-notice"
        />
      ))}
    </div>
  );
}

export default function Testimonials({ heading, description, testimonials = [] }) {
  if (!testimonials.length) return null;

  return (
    <Section tone="surface">
      <SectionHeading align="center" title={heading} description={description} />

      <ul className="mt-12 grid gap-5 md:grid-cols-3 lg:gap-6">
        {testimonials.map((t) => {
          const meta = [t.nationality, t.visaType].filter(Boolean).join(" · ");
          const initials =
            t.initials || (t.name || "?").slice(0, 2).toUpperCase();

          return (
            <li
              key={`${t.name}-${t.quote.slice(0, 24)}`}
              className="flex flex-col rounded-card border border-line bg-canvas p-7 md:p-8"
            >
              <Stars rating={t.rating} />
              <blockquote className="mt-5 flex-1 text-[1.0625rem] leading-8 text-ink-body">
                “{t.quote}”
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-line-soft pt-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-[0.8125rem] font-semibold text-ink-soft ring-1 ring-line">
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block text-meta font-semibold text-ink">
                    {t.name}
                  </span>
                  {meta && (
                    <span className="mt-0.5 block truncate text-[0.8125rem] text-ink-soft">
                      {meta}
                    </span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
