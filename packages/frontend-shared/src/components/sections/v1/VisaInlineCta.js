"use client";

import Container from "../../shared/layout/Container.js";

export default function VisaInlineCta({ text, ctaText = "Get free consultation", onCtaClick }) {
  return (
    <div className="pt-8 pb-12 md:pt-10 md:pb-16">
      <Container>
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-outfit text-[15px] leading-6 text-gray-700">{text}</p>
          <button
            type="button"
            onClick={onCtaClick}
            className="min-h-11 shrink-0 rounded-full bg-primary-700 px-5 font-outfit text-[14px] font-semibold text-white hover:bg-primary-800"
          >
            {ctaText}
          </button>
        </div>
      </Container>
    </div>
  );
}
