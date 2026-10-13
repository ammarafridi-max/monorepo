'use client';

import { BedDouble, ShieldCheck, Utensils, Star, Tag } from 'lucide-react';
import { formatDate } from '../../utils/dates';
import { formatAmount } from '../../utils/currency';

function StarRating({ stars }) {
  const count = Math.round(Number(stars) || 0);
  if (count < 1) return null;
  return (
    <span className="inline-flex items-center gap-0.5 shrink-0" aria-label={`${count} star hotel`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
      ))}
    </span>
  );
}

// Two different prices sit on this card: what the customer pays us (a flat fee) and
// what the room itself lists for, which is only there to signal how pricey the hotel is.
export default function HotelOfferCard({ offer, price, currency, nights, isExpanded, onSelect, children }) {
  const listedAmount = offer.price?.amount;
  const listedCurrency = offer.price?.currency;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <BedDouble size={20} className="text-primary-700" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{offer.hotel?.name ?? 'Hotel'}</p>
            <StarRating stars={offer.hotel?.stars} />
          </div>
          {offer.hotel?.address && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{offer.hotel.address}</p>
          )}
          <p className="text-xs text-gray-600 truncate mt-1">{offer.roomName ?? 'Room'}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            {offer.boardName && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Utensils size={12} className="text-gray-400" />
                {offer.boardName}
              </span>
            )}
            {Number.isFinite(listedAmount) && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Tag size={12} className="text-gray-400" />
                Room lists at {listedCurrency} {formatAmount(listedAmount)}
                {nights ? ` for ${nights} night${nights > 1 ? 's' : ''}` : ''}
              </span>
            )}
            {offer.freeCancellationUntil && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                <ShieldCheck size={12} />
                Free cancellation until {formatDate(offer.freeCancellationUntil)}
              </span>
            )}
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center justify-between gap-4 shrink-0">
          {Number.isFinite(price) && (
            <div className="text-left sm:text-right">
              <p className="text-[11px] text-gray-400 leading-none mb-1">Book now for</p>
              <p className="text-sm font-bold text-gray-900">
                {currency} {formatAmount(price)}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onSelect}
            disabled={isExpanded}
            className={`w-[40%] sm:w-auto sm:min-w-[120px] rounded-full py-2 sm:px-6 text-sm cursor-pointer duration-300 ${
              isExpanded ? 'bg-black text-white' : 'bg-gray-200 text-black hover:bg-gray-300'
            }`}
            aria-label={`Select ${offer.hotel?.name ?? 'hotel'} ${offer.roomName ?? ''}`.trim()}
          >
            {isExpanded ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>

      {isExpanded && <div className="border-t border-gray-100 bg-gray-50/60 p-5">{children}</div>}
    </div>
  );
}
