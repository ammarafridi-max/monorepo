'use client';

import { useContext, useEffect, useState } from 'react';
import {
  SlidersHorizontal,
  LayoutList,
  TableProperties,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { InsuranceContext } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import { useGetInsuranceQuotes } from '@travel-suite/frontend-shared/hooks/insurance/useGetInsuranceQuotes';
import QuoteCard from '@travel-suite/frontend-shared/components/v1/cards/QuoteCard';
import PlanComparison from '@travel-suite/frontend-shared/components/v1/PlanComparison';
import InsuranceLayout from '@/layouts/InsuranceLayout';
import { trackViewItemList, trackSelectItem } from '@/lib/analytics';
import { calcDays } from '@travel-suite/frontend-shared/utils/insuranceHelpers';

const sortOptions = ['Recommended', 'Price: Low to high', 'Price: High to low'];

function QuoteResults() {
  const {
    region,
    quantity,
    schemeId,
    handleSelectQuote,
    journeyType,
    startDate,
    endDate,
    setQuotes,
  } = useContext(InsuranceContext);
  const [view, setView] = useState('cards');
  const [sortBy, setSortBy] = useState('Recommended');

  const { insuranceQuotes, getInsuranceQuotes, isPendingInsuranceQuotes } =
    useGetInsuranceQuotes();

  const days = calcDays(journeyType, startDate, endDate);

  useEffect(() => {
    getInsuranceQuotes({ journeyType, startDate, endDate, region, quantity });
  }, [endDate, getInsuranceQuotes, journeyType, quantity, region, startDate]);

  useEffect(() => {
    if (insuranceQuotes?.quotes) {
      const quoteList = Object.values(insuranceQuotes.quotes);
      setQuotes(quoteList);
      trackViewItemList({ plans: quoteList, journeyType, region, days, totalTravellers });
    }
  }, [insuranceQuotes, setQuotes]);

  const quotes = insuranceQuotes?.quotes
    ? Object.values(insuranceQuotes.quotes)
    : [];
  const quoteId = insuranceQuotes?.quote_id;
  const totalTravellers =
    quantity.adults + quantity.children + quantity.seniors;

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === 'Price: Low to high')
      return Number(a.premium) - Number(b.premium);
    if (sortBy === 'Price: High to low')
      return Number(b.premium) - Number(a.premium);
    return 0;
  });

  if (isPendingInsuranceQuotes) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <p className="text-sm text-gray-500">
          Finding the best plans for your trip…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {quotes.length} plan{quotes.length !== 1 ? 's' : ''} available
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Showing results for{' '}
            <span className="font-medium text-gray-700">
              {region?.name || 'your trip'}
            </span>
            {totalTravellers > 0 && (
              <span>
                {' '}
                · {totalTravellers} traveller{totalTravellers > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setView('cards')}
              title="Card view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                view === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList size={14} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView('compare')}
              title="Compare view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                view === 'compare'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TableProperties size={14} />
              Compare
            </button>
          </div>

          {view === 'cards' && (
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-gray-400" />
              <span className="text-sm text-gray-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500">
            No plans found for your trip details.
          </p>
        </div>
      ) : view === 'cards' ? (
        <div className="flex flex-col gap-5">
          {sortedQuotes?.map((quote, index) => (
            <QuoteCard
              key={quote.scheme_id}
              quote={quote}
              isSelected={quote.scheme_id == schemeId}
              onSelect={() => {
                trackSelectItem({ plan: quote, journeyType, region, days, totalTravellers, index });
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

export default function QuotesPage() {
  return (
    <InsuranceLayout>
      <QuoteResults />
    </InsuranceLayout>
  );
}
