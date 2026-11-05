import * as LucideIcons from "lucide-react";
import { Shell } from "@/components/design-system/Shell";

export default function TrustStrip({ items = [], caption }) {
  if (!items.length) return null;

  return (
    <section aria-labelledby="trust-heading" className="bg-surface pb-16 pt-14 md:pb-22 md:pt-16">
      <Shell>
        <div className="rounded-panel border border-line bg-canvas p-6 md:p-9">
          <h2
            id="trust-heading"
            className="text-[1.0625rem] font-semibold text-ink"
          >
            What every application gets
          </h2>
          {caption && (
            <p className="mt-1.5 text-meta text-ink-soft">{caption}</p>
          )}

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line">
            {items.map(({ title, caption: text, icon }, i) => {
              const Icon = LucideIcons[icon] || LucideIcons.Check;
              return (
                <li
                  key={title}
                  className={`lg:px-7 ${i === 0 ? "lg:pl-0" : ""} ${
                    i === items.length - 1 ? "lg:pr-0" : ""
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-positive-soft text-positive ring-1 ring-positive/15">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold leading-snug text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 text-meta leading-6 text-ink-body">{text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </Shell>
    </section>
  );
}
