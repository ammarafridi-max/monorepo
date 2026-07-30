"use client";

import { Check, Building2, Zap, Languages } from "lucide-react";
import Container from "../../shared/layout/Container.js";

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
    <section className="relative overflow-hidden bg-gray-50">
      <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary-100/40" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full bg-primary-100/30" />

      <Container className="relative pt-12 pb-14 md:pt-14 md:pb-16 lg:pt-16 lg:pb-20">
        <div className="max-w-4xl">
          {countryName && (
            <div className="flex items-center gap-3 mb-7">
              <span className="block w-8 h-[2px] bg-primary-500 rounded-full shrink-0" />
              <span className="text-gray-600 text-[12px] font-outfit font-semibold uppercase tracking-[0.16em]">
                {countryName} Visa Assistance
              </span>
            </div>
          )}

          {headline && (
            <h1 className="font-outfit font-bold text-[32px] md:text-[44px] lg:text-[52px] text-gray-900 leading-[1.1] tracking-[-0.025em] mb-5 max-w-3xl">
              {headFirst}
              {headSecond && (
                <>
                  {" "}
                  <span className="text-primary-600">{headSecond}</span>
                </>
              )}
            </h1>
          )}

          {subheadline && (
            <p className="font-outfit font-light text-[17px] md:text-[19px] text-gray-600 leading-[1.7] mb-7 max-w-2xl">
              {subheadline}
            </p>
          )}

          {qualifierItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-9">
              {qualifierItems.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-[13px] font-outfit font-medium text-gray-700 shadow-sm"
                >
                  <Check size={12} className="text-primary-600 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 font-outfit font-semibold text-[16px] py-3.5 px-7 rounded-full bg-primary-700 hover:bg-primary-800 text-white shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              {ctaText}
            </button>
            <a
              href="#packages"
              className="inline-flex items-center gap-2 text-[15px] font-outfit font-medium py-3.5 px-6 rounded-full border border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 transition-colors duration-200"
            >
              View packages
            </a>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-outfit font-light text-gray-600">
              <Building2 size={14} className="text-primary-600 shrink-0" />
              Licensed Dubai office
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-outfit font-light text-gray-600">
              <Zap size={14} className="text-primary-600 shrink-0" />
              3-minute response time
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-outfit font-light text-gray-600">
              <Languages size={14} className="text-primary-600 shrink-0" />
              Native-language support
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
