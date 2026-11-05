import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Section, SectionHeading } from "@/components/design-system/Shell";

function cheapestPackage(visa) {
  return (visa.packages ?? []).reduce(
    (min, p) =>
      min == null || (Number(p.price) || 0) < (Number(min.price) || 0) ? p : min,
    null,
  );
}

function DestinationCard({ visa, basePath, priority }) {
  const cheapest = cheapestPackage(visa);
  const from = cheapest ? Number(cheapest.price) || null : null;
  const currency = cheapest?.currency || "AED";
  const timeline = cheapest?.timeline;
  const blurb = visa.excerpt || visa.heroSubheadline || "";

  return (
    <li>
      <Link
        href={`${basePath}/visa/${visa.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <div className="relative m-2 aspect-[16/10] overflow-hidden rounded-[1rem] bg-canvas">
          {visa.heroImageUrl && (
            <Image
              src={visa.heroImageUrl}
              alt={`${visa.countryName} visa`}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          )}
          {timeline && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/92 px-3 py-1.5 text-[0.8125rem] font-medium text-ink shadow-raised backdrop-blur">
              <Clock size={13} aria-hidden="true" className="text-ink-soft" />
              {timeline}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
          <h3 className="text-card font-semibold text-ink">
            {visa.countryName} visa
          </h3>
          {blurb && (
            <p className="mb-6 mt-2.5 line-clamp-2 text-meta leading-6 text-ink-body">
              {blurb}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-line-soft pt-5">
            {from != null ? (
              <span className="flex flex-col">
                <span className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-faint">
                  From
                </span>
                <span className="mt-0.5 font-mono text-[1.125rem] font-semibold text-ink">
                  {currency} {from.toLocaleString()}
                </span>
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-brand-600 transition-colors group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
              <ArrowRight size={17} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default function Destinations({ visas = [], basePath, allHref, heading, description }) {
  if (!visas.length) return null;

  return (
    <Section id="destinations" tone="canvas">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading title={heading} description={description} />
        <Link
          href={allHref}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-5 text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          All destinations
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {visas.map((visa, i) => (
          <DestinationCard
            key={visa.slug}
            visa={visa}
            basePath={basePath}
            priority={i === 0}
          />
        ))}
      </ul>
    </Section>
  );
}
