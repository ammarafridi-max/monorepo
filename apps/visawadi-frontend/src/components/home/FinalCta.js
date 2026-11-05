import Button from "@/components/design-system/Button";
import { Shell } from "@/components/design-system/Shell";

export default function FinalCta({ heading, text, primary, secondary }) {
  return (
    <section className="bg-surface pb-16 md:pb-22 lg:pb-26">
      <Shell>
        <div className="relative overflow-hidden rounded-panel border border-line bg-canvas px-6 py-14 text-center md:px-12 md:py-18">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(79,70,229,0.07),transparent_70%)]"
          />
          <h2 className="relative mx-auto max-w-2xl text-title font-semibold text-ink">
            {heading}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lede text-ink-body">
            {text}
          </p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={primary.href} size="lg" className="w-full sm:w-auto">
              {primary.label}
            </Button>
            {secondary && (
              <Button
                href={secondary.href}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                {...(secondary.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {secondary.label}
              </Button>
            )}
          </div>
        </div>
      </Shell>
    </section>
  );
}
