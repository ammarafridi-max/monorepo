'use client';

import { useContext } from 'react';
import { Check, X, Minus } from 'lucide-react';
import { InsuranceContext } from '../../../contexts/InsuranceContext.js';

function formatPremium(premium) {
  return Number(premium).toFixed(2);
}

function parseName(name) {
  const parts = name?.split(' - ');
  return parts?.length >= 2 ? parts.slice(1).join(' - ') : name;
}

function isSectionHeader(b) {
  return b.section !== '' && b.amount === '';
}

// Base plan benefits only (option === 0), excluding section headers
function getBaseBenefits(benefits) {
  return (benefits ?? []).filter((b) => b.option === 0 && !isSectionHeader(b));
}

function getQuoteBenefitMap(quote) {
  const map = {};
  for (const b of getBaseBenefits(quote.benefits)) {
    map[b.cover] = b.amount;
  }
  return map;
}

function CellValue({ value }) {
  if (value === undefined || value === null) {
    return <Minus size={14} className="text-gray-300 mx-auto" />;
  }
  if (value === 'Not Covered') {
    return (
      <span className="inline-flex flex-col items-center gap-0.5 text-gray-400">
        <X size={15} strokeWidth={2} />
        <span className="text-[11px]">Not Covered</span>
      </span>
    );
  }
  if (value === 'Included') {
    return (
      <span className="inline-flex flex-col items-center gap-0.5 text-green-600">
        <Check size={15} strokeWidth={2.5} />
        <span className="text-[11px] font-semibold">Included</span>
      </span>
    );
  }
  return <span className="text-sm font-semibold text-gray-800">{value}</span>;
}

/* --- Main component ------------------------------------------------------- */

export default function PlanComparison({ quotes, quoteId }) {
  const { schemeId, handleSelectQuote } = useContext(InsuranceContext);

  // Collect all unique benefit names in order of first appearance (base only)
  const allBenefitNames = [];
  const seen = new Set();
  for (const quote of quotes) {
    for (const b of getBaseBenefits(quote.benefits)) {
      if (!seen.has(b.cover)) {
        seen.add(b.cover);
        allBenefitNames.push(b.cover);
      }
    }
  }

  const benefitMaps = quotes.map(getQuoteBenefitMap);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full border-collapse min-w-[640px]">
        {/* -- Plan headers ----------------------------------------------- */}
        <thead>
          <tr>
            <th className="w-44 bg-white border-b border-gray-200 p-0" />
            {quotes.map((quote) => {
              const isSelected = quote.scheme_id == schemeId;
              return (
                <th
                  key={quote.scheme_id}
                  className={`border-b border-gray-200 p-0 transition-colors ${isSelected ? 'bg-primary-50' : 'bg-white'}`}
                >
                  <div className="flex flex-col items-center gap-3 px-4 pt-5 pb-4">
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Check size={9} strokeWidth={3} /> Selected
                      </span>
                    )}
                    <p className="text-sm font-extrabold text-gray-900 text-center leading-snug">
                      {parseName(quote.name)}
                    </p>
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-gray-900">
                        <span className="text-sm font-semibold text-gray-500">
                          {quote.currency}
                        </span>{' '}
                        {formatPremium(quote.premium)}
                      </p>
                      <p className="text-[11px] text-gray-400">total premium</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectQuote(quote.scheme_id, quoteId)
                      }
                      className={`w-full text-xs font-bold py-2 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {isSelected ? 'Plan Selected' : 'Select Plan'}
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* -- Benefit rows ----------------------------------------------- */}
        <tbody>
          {allBenefitNames.map((cover, rowIdx) => (
            <tr key={cover} className={rowIdx % 2 === 0 ? '' : 'bg-white'}>
              <td className="px-5 py-3 text-sm text-gray-500 font-medium border-r border-gray-100">
                {cover}
              </td>
              {benefitMaps.map((map, colIdx) => {
                const isSelected = quotes[colIdx].scheme_id == schemeId;
                return (
                  <td
                    key={quotes[colIdx].scheme_id}
                    className={`px-3 py-3 text-center border-r last:border-r-0 border-gray-100 transition-colors ${isSelected ? 'bg-primary-50/60' : ''}`}
                  >
                    <CellValue value={map[cover]} />
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Bottom select row */}
          <tr className="border-t-2 border-gray-100">
            <td className="bg-white" />
            {quotes.map((quote) => {
              const isSelected = quote.scheme_id == schemeId;
              return (
                <td
                  key={quote.scheme_id}
                  className={`px-4 py-4 text-center ${isSelected ? 'bg-primary-50/60' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectQuote(quote.scheme_id, quoteId)}
                    className={`w-full text-xs font-bold py-2 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Select Plan'}
                  </button>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
