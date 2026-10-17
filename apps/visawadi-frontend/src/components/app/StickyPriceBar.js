'use client';

import { useEffect, useRef, useState } from 'react';

export default function StickyPriceBar({
  fromPrice,
  currency = 'AED',
  ctaText = 'Get free consultation',
  onCtaClick,
  hidden = false,
}) {
  const sentinel = useRef(null);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show = pastHero && !hidden;

  return (
    <>
      <div ref={sentinel} aria-hidden="true" />
      <div
        className={`fixed inset-x-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur transition-transform duration-200 lg:hidden ${
          show ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ bottom: 'calc(58px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          {fromPrice != null && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">From</p>
              <p className="font-mono text-[19px] font-semibold leading-none tracking-tight text-gray-900">
                {currency} {Number(fromPrice).toLocaleString()}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onCtaClick}
            className="min-h-12 shrink-0 rounded-xl bg-accent-500 px-5 font-semibold text-white hover:bg-accent-600"
          >
            {ctaText}
          </button>
        </div>
      </div>
    </>
  );
}
