"use client";

import { useEffect, useRef, useState } from "react";

export default function VisaStickyCta({ fromPrice, currency = "AED", ctaText = "Get free consultation", onCtaClick, hidden = false }) {
  const sentinel = useRef(null);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { rootMargin: "0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show = pastHero && !hidden;

  return (
    <>
      <div ref={sentinel} aria-hidden="true" />
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 pr-20 transition-transform duration-200 lg:hidden ${
          show ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {fromPrice != null && (
            <div className="min-w-0">
              <p className="font-outfit text-[11px] uppercase tracking-wide text-gray-500">From</p>
              <p className="font-outfit font-bold text-[18px] leading-none text-gray-900">
                {currency} {Number(fromPrice).toLocaleString()}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onCtaClick}
            className="min-h-11 flex-1 rounded-full bg-accent-500 px-4 font-outfit text-[14px] font-semibold text-gray-900 hover:bg-accent-600"
          >
            {ctaText}
          </button>
        </div>
      </div>
    </>
  );
}
