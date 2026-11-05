'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutList,
  TableProperties,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { InsuranceContext } from '../../contexts/InsuranceContext';
import { useGetInsuranceQuotes } from '../../hooks/insurance/useGetInsuranceQuotes';
import QuoteCard from '../../components/cards/QuoteCard';
import PlanComparison from '../../components/sections/v1/PlanComparison';
import InsuranceLayout from '../../layouts/InsuranceLayout';
import { calcDays } from '../../utils/insuranceHelpers';

function QuoteResults({ onViewItemList, onSelectItem }) {
  const {
    region,
    quantity,
    schemeId,
    handleSelectQuote,
    journeyType,
    startDate,
    endDate,
    setQuotes,
    hydrated,
  } = useContext(InsuranceContext);
  const [view, setView] = useState('cards');

  const { insuranceQuotes, getInsuranceQuotes, isPendingInsuranceQuotes } =
    useGetInsuranceQuotes();

  const totalTravellers = quantity.adults + quantity.children + quantity.seniors;
  const days = calcDays(journeyType, startDate, endDate);

  const isMultiYear = journeyType === 'annual' || journeyType === 'biennial';
  const canQuote = Boolean(startDate) && Boolean(region?.id) && (isMultiYear || Boolean(endDate));

  useEffect(() => {
    if (!hydrated || !canQuote) return;
    getInsuranceQuotes({ journeyType, startDate, endDate, region, quantity });
  }, [hydrated, canQuote, endDate, getInsuranceQuotes, journeyType, quantity, region, startDate]);

  useEffect(() => {
    if (insuranceQuotes?.quotes) {
      const quoteList = Object.values(insuranceQuotes.quotes);
      setQuotes(quoteList);
      onViewItemList?.({ plans: quoteList, journeyType, region, days, totalTravellers });
    }
  }, [insuranceQuotes, setQuotes]);

  const quotes = insuranceQuotes?.quotes
    ? Object.values(insuranceQuotes.quotes)
    : [];
  const quoteId = insuranceQuotes?.quote_id;

  if (hydrated && !canQuote) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={28} className="text-gray-300" />
        <p className="text-sm text-gray-500">
          Your trip details are missing. Please start from the beginning.
        </p>
        <Link
          href="/"
          className="text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
        >
          Start a new quote
        </Link>
      </div>
    );
  }

  if (!hydrated || isPendingInsuranceQuotes) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <p className="text-sm text-gray-500">
          Finding the best plans for your trip…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 py-2">
      <div className="flex items-center justify-end mb-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setView('cards')}
              title="Card view"
              className={`flex items-center px-2.5 py-1.5 rounded-lg transition-colors ${
                view === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList size={15} />
            </button>
            <button
              type="button"
              onClick={() => setView('compare')}
              title="Compare view"
              className={`flex items-center px-2.5 py-1.5 rounded-lg transition-colors ${
                view === 'compare'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TableProperties size={15} />
            </button>
          </div>
      </div>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500">
            No plans found for your trip details.
          </p>
        </div>
      ) : view === 'cards' ? (
        <div className="flex flex-col gap-5">
          {quotes?.map((quote, index) => (
            <QuoteCard
              key={quote.scheme_id}
              quote={quote}
              isSelected={quote.scheme_id == schemeId}
              supplierLogo={quote.supplier === 'AXA' ? '/axa-logo.png' : undefined}
              supplierName={quote.supplier}
              onSelect={() => {
                onSelectItem?.({ plan: quote, journeyType, region, days, totalTravellers, index });
                handleSelectQuote(quote.scheme_id, quoteId);
              }}
            />
          ))}
        </div>
      ) : (
        <PlanComparison quotes={quotes} quoteId={quoteId} />
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        Prices shown are inclusive of all taxes. Final price confirmed at
        checkout.
      </p>
    </div>
  );
}

export default function InsuranceQuotePage({ onViewItemList, onSelectItem }) {
  return (
    <InsuranceLayout>
      <QuoteResults onViewItemList={onViewItemList} onSelectItem={onSelectItem} />
    </InsuranceLayout>
  );
}
