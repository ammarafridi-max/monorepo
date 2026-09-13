'use client';

import { useEffect, useState } from 'react';
import { useDummyTicketPricing } from '../../../hooks/pricing/useDummyTicketPricing';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { normalizePricingOptions } from '../../../utils/dummyTicketPricing';

export default function StickyBookingBar({ targetId = 'form', label = 'Book now', product = 'dummy ticket' }) {
  const [visible, setVisible] = useState(false);
  const { pricing } = useDummyTicketPricing();
  const { selectedCurrency, formatMoney } = useCurrency();
  const lowest = normalizePricingOptions(pricing)[0];
  const price = lowest ? formatMoney(lowest.price, 'AED') : null;

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: '-80px 0px 0px 0px',
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  function scrollToForm() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 lg:hidden transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-3 mb-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] border border-gray-200">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Verifiable {product}</p>
          {price && (
            <p className="text-base font-semibold text-gray-900">
              From {price.code || selectedCurrency?.code || 'AED'}{' '}
              {Number(price.amount).toLocaleString('en', { maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={scrollToForm}
          tabIndex={visible ? 0 : -1}
          className="shrink-0 rounded-xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
