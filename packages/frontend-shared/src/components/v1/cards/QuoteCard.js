'use client';

import { useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';

function isSectionHeader(b) {
  return b.section !== '' && b.amount === '';
}

function getBaseBenefits(benefits) {
  return (benefits ?? []).filter((b) => b.option === 0 && !isSectionHeader(b));
}

function BenefitRow({ b }) {
  const notCovered = b.amount === 'Not Covered';
  return (
    <div className="flex items-start gap-2 text-sm">
      {notCovered ? (
        <X size={14} className="text-gray-300 shrink-0 mt-0.5" />
      ) : (
        <Check size={14} className="text-primary-600 shrink-0 mt-0.5" />
      )}
      <span className={notCovered ? 'text-gray-400' : 'text-gray-700'}>
        {b.cover}
        {!notCovered && b.amount && (
          <span className="ml-1 font-semibold text-gray-900">— {b.amount}</span>
        )}
      </span>
    </div>
  );
}

function formatPremium(premium) {
  return Number(premium).toFixed(2);
}

function parseName(name) {
  const parts = name?.split(' - ');
  return parts?.length >= 2 ? parts.slice(1).join(' - ') : name;
}

export default function QuoteCard({ quote, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  const baseBenefits = getBaseBenefits(quote.benefits);
  const preview = baseBenefits.slice(0, 6);
  const rest = baseBenefits.slice(6);

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all ${
        isSelected
          ? 'border-primary-500 shadow-lg shadow-primary-100'
          : 'border-gray-200 hover:border-primary-200 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-3.5 left-6">
          <span className="inline-flex items-center gap-1 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            <Check size={10} strokeWidth={3} /> Selected
          </span>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <p className="text-lg font-bold text-gray-900">
            {parseName(quote.name)}
          </p>

          {preview.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {preview.map((b, i) => (
                <BenefitRow key={i} b={b} />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <>
              <button
                onClick={() => setExpanded((p) => !p)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline self-start"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
                {expanded
                  ? 'Hide details'
                  : `View all ${baseBenefits.length} coverage items`}
              </button>

              {expanded && (
                <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {rest.map((b, i) => (
                    <BenefitRow key={i} b={b} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 md:min-w-[160px]">
          <div className="text-center md:text-right">
            <p className="text-xl font-medium text-gray-900">
              <span className="text-sm font-semibold text-gray-500">
                {quote.currency}
              </span>{' '}
              {formatPremium(quote.premium)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">total premium</p>
          </div>
          <button
            onClick={onSelect}
            className={`w-full md:w-auto text-center text-sm font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer ${
              isSelected
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-900 text-white'
            }`}
          >
            {isSelected ? 'Plan Selected' : 'Select Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
