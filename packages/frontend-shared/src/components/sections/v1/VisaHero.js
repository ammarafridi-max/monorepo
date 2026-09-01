"use client";

import Image from "next/image";
import * as LucideIcons from "lucide-react";
import Container from "../../shared/layout/Container.js";

function splitHeadline(text = "") {
  const idx = text.indexOf(". ");
  if (idx === -1) return { first: text, second: "" };
  return { first: text.slice(0, idx + 1), second: text.slice(idx + 2) };
}

export default function VisaHero({
  headline = "",
  subheadline = "",
  ctaText = "Get free consultation",
  imageUrl = "",
  imageAlt = "",
  onCtaClick,
  // Supplied by the consuming app so this stays brand-neutral and no claim is
  // hardcoded in a shared component.
  trustItems = [],
}) {
  const { first: headFirst, second: headSecond } = splitHeadline(headline);
  const hasImage = Boolean(imageUrl);

  return (
    <section
      className={`relative overflow-hidden ${hasImage ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {hasImage ? (
        <>
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 1920px) 1920px, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-gray-900/85 via-gray-900/70 to-gray-900/85" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary-100/40" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full bg-primary-100/30" />
        </>
      )}

      <Container className="relative pt-16 pb-18 md:pt-18 md:pb-20 lg:pt-20 lg:pb-24">
        <div className="max-w-4xl lg:mx-auto lg:text-center">
          {headline && (
            <h1
              className={`font-outfit font-bold text-[32px] md:text-[44px] lg:text-[52px] leading-[1.1] tracking-[-0.025em] mb-5 max-w-3xl lg:mx-auto ${
                hasImage ? "text-white" : "text-gray-900"
              }`}
            >
              {headFirst}
              {headSecond && (
                <>
                  {" "}
                  <span
                    className={hasImage ? "text-primary-300" : "text-primary-600"}
                  >
                    {headSecond}
                  </span>
                </>
              )}
            </h1>
          )}

          {subheadline && (
            <p
              className={`font-outfit font-light text-[17px] md:text-[19px] leading-[1.7] mb-7 max-w-2xl lg:mx-auto ${
                hasImage ? "text-gray-200" : "text-gray-600"
              }`}
            >
              {subheadline}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mb-8 lg:justify-center">
            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 font-outfit font-semibold text-[14px] py-2.5 px-5 sm:text-[16px] sm:py-3.5 sm:px-7 rounded-full bg-accent-500 hover:bg-accent-600 text-gray-900 shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              {ctaText}
            </button>
            <a
              href="#packages"
              className={`inline-flex items-center gap-2 text-[14px] py-2.5 px-5 sm:text-[15px] sm:py-3.5 sm:px-6 font-outfit font-medium rounded-full border transition-colors duration-200 ${
                hasImage
                  ? "border-white/40 text-white hover:bg-white/10 hover:border-white/70"
                  : "border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400"
              }`}
            >
              View packages
            </a>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2.5 lg:justify-center">
            {trustItems.map(({ icon, label }) => {
              const Icon = LucideIcons[icon] || LucideIcons.Check;
              return (
              <span
                key={label}
                className={`inline-flex items-center gap-1.5 text-[13px] font-outfit font-normal ${
                  hasImage ? "text-gray-200" : "text-gray-600"
                }`}
              >
                <Icon
                  size={14}
                  className={`shrink-0 ${hasImage ? "text-primary-300" : "text-primary-600"}`}
                />
                {label}
              </span>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
