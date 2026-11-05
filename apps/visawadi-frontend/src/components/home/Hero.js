import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "@/components/design-system/Button";
import { Shell } from "@/components/design-system/Shell";
import VisaCheckerPanel from "@/components/home/VisaCheckerPanel";

export default function Hero({ title, lede, primary, secondary, note, quickLinks = [] }) {
  return (
    <section className="relative overflow-hidden bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(79,70,229,0.08),transparent_72%)]"
      />

      <Shell className="relative pb-14 pt-9 md:pb-24 md:pt-16 lg:pb-28 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-display font-semibold text-ink">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lede text-ink-body md:mt-6">
            {lede}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
            <Button href={primary.href} size="lg" className="w-full sm:w-auto">
              {primary.label}
            </Button>
            <Link
              href={secondary.href}
              className="inline-flex min-h-14 w-full items-center justify-center gap-1.5 rounded-full px-6 text-[1.0625rem] font-semibold text-ink-body transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              {secondary.label}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-4xl md:mt-16">
          <div className="rounded-panel border border-line bg-surface p-5 shadow-panel sm:p-7 md:p-8">
            <div className="mb-5 flex flex-col gap-1 border-b border-line-soft pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
              <h2 className="text-[1.0625rem] font-semibold text-ink">
                Do you need a visa?
              </h2>
              <p className="hidden text-meta text-ink-soft sm:block">
                Checked against the issuing authority, not aggregators
              </p>
            </div>

            <VisaCheckerPanel />
          </div>

          {quickLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 text-meta text-ink-soft">Popular:</span>
              {quickLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-[0.9375rem] font-medium text-ink-body shadow-raised transition-colors hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}

          {note && (
            <p className="mt-5 text-center text-meta text-ink-faint">{note}</p>
          )}
        </div>
      </Shell>
    </section>
  );
}
