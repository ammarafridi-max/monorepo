"use client";

import { Check, Building2, Zap, Languages } from "lucide-react";
import Container from "../layout/Container.js";

function splitHeadline(text = "") {
  const idx = text.indexOf(". ");
  if (idx === -1) return { first: text, second: "" };
  return { first: text.slice(0, idx + 1), second: text.slice(idx + 2) };
}

export default function VisaHero({
  countryName = "",
  headline = "",
  subheadline = "",
  ctaText = "Get free consultation",
  qualifierItems = [],
  onCtaClick,
}) {
  const { first: headFirst, second: headSecond } = splitHeadline(headline);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(165deg,#fdfcfb_0%,#f7f5f0_45%,#fafbff_100%)]">
      <div
        className="pointer-events-none select-none absolute -top-6 -right-6 lg:top-10 lg:right-10 opacity-[0.04]"
        aria-hidden="true"
      >
        <div className="w-72 h-72 rounded-full border-[10px] border-gray-900 flex items-center justify-center">
          <div className="w-56 h-56 rounded-full border-[3px] border-gray-900 flex items-center justify-center">
            <div className="text-center leading-none">
              <p className="text-[10px] font-outfit font-black uppercase tracking-[0.35em] text-gray-900">
                Official
              </p>
              <p className="text-[8px] font-outfit uppercase tracking-[0.25em] text-gray-900 mt-1.5">
                Visa Service
              </p>
              <p className="text-[8px] font-outfit uppercase tracking-[0.25em] text-gray-900 mt-0.5">
                Dubai · UAE
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -left-48 -top-24 h-[520px] w-[520px] rounded-full bg-primary-100/50 blur-3xl" />

      <Container className="relative pt-32 pb-14 md:pt-36 md:pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-4xl">
          {countryName && (
            <div className="flex items-center gap-3 mb-7">
              <span className="block w-8 h-[2px] bg-accent-500 rounded-full shrink-0" />
              <span className="text-gray-600 text-[12px] font-outfit font-semibold uppercase tracking-[0.16em]">
                {countryName} Visa Assistance
              </span>
            </div>
          )}

          {headline && (
            <h1 className="font-outfit font-medium text-[32px] md:text-[44px] lg:text-[52px] text-gray-900 leading-[1.1] tracking-[-0.025em] mb-5 max-w-3xl">
              {headFirst}
              {headSecond && (
                <>
                  {" "}
                  <span className="font-light italic text-gray-500">
                    {headSecond}
                  </span>
                </>
              )}
            </h1>
          )}

          {subheadline && (
            <p className="font-outfit font-light text-[17px] md:text-[19px] text-gray-500 leading-[1.7] mb-7 max-w-2xl">
              {subheadline}
            </p>
          )}

          {qualifierItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-9">
              {qualifierItems.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-[13px] font-outfit font-light text-gray-600 shadow-sm"
                >
                  <Check size={12} className="text-primary-500 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 font-outfit font-medium text-[16px] py-3.5 px-7 rounded-xl bg-accent-500 hover:bg-accent-600 text-white shadow-[0_4px_16px_rgba(0,0,0,0.14)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              {ctaText}
            </button>
            <a
              href="#packages"
              className="inline-flex items-center gap-2 text-[15px] font-outfit font-light py-3.5 px-6 rounded-xl border border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 transition-colors duration-200"
            >
              View packages
            </a>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-outfit font-light text-gray-500">
              <Building2 size={14} className="text-primary-500 shrink-0" />
              Licensed Dubai office
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-outfit font-light text-gray-500">
              <Zap size={14} className="text-primary-500 shrink-0" />
              3-minute response time
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-outfit font-light text-gray-500">
              <Languages size={14} className="text-primary-500 shrink-0" />
              Native-language support
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
