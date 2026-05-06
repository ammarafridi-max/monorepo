"use client";

import Container from "../../shared/layout/Container.js";

function CtaButton({ children, onClick, href, size = "md" }) {
  const sz = size === "lg" ? "text-[15px] py-3 px-6" : "text-[14px] py-2.5 px-5";
  const cls = `inline-flex items-center justify-center gap-2 font-outfit font-medium rounded-xl bg-accent-500 hover:bg-accent-600 text-white border border-accent-500 transition-colors duration-200 cursor-pointer ${sz}`;
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {children}
      </button>
    );
  return (
    <a href={href || "#"} className={cls}>
      {children}
    </a>
  );
}

export default function VisaFinalCta({ headline, ctaText, onCtaClick }) {
  if (!headline && !ctaText) return null;
  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="rounded-2xl bg-gradient-to-br from-primary-800 to-primary-950 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between overflow-hidden relative">

          <div className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -right-8 -bottom-12 w-40 h-40 rounded-full bg-accent-500/10" />

          <div className="relative">
            {headline && (
              <h2 className="font-outfit font-medium text-[22px] md:text-[26px] text-white leading-[1.25] mb-2">
                {headline}
              </h2>
            )}
            <p className="font-outfit font-light text-[14px] text-white/60 max-w-md leading-6">
              Our specialists are available 7 days a week. Get a free
              consultation before you commit.
            </p>
          </div>

          <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
            <CtaButton onClick={onCtaClick} size="lg">
              {ctaText || "Apply now"}
            </CtaButton>
            <a
              href="https://wa.me/971000000000"
              className="inline-flex items-center justify-center gap-2 text-[14px] font-outfit font-medium py-3 px-5 rounded-xl border border-white/25 text-white hover:bg-white/10 transition-colors duration-200 whitespace-nowrap"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
