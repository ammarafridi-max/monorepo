'use client';

import { BedDouble, Star } from 'lucide-react';
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

export default function HotelOfferCard({ hotel, price, currency, nights, isExpanded, onSelect, children }) {
  const listed = hotel.totalRate?.amount ?? hotel.ratePerNight?.amount;
  const listedIsTotal = Boolean(hotel.totalRate?.amount);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {hotel.thumbnail ? (
          <img
            src={hotel.thumbnail}
            alt={hotel.name ?? 'Hotel'}
            loading="lazy"
            className="w-full h-36 sm:w-24 sm:h-20 rounded-xl object-cover shrink-0 bg-gray-100"
          />
        ) : (
          <div className="w-full h-36 sm:w-24 sm:h-20 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <BedDouble size={20} className="text-primary-700" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{hotel.name ?? 'Hotel'}</p>
            <StarRating stars={hotel.stars} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            {hotel.rating && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                <span className="font-bold text-gray-900">{hotel.rating}</span>
                {hotel.reviews ? `(${Number(hotel.reviews).toLocaleString('en-US')} reviews)` : null}
              </span>
            )}
            {Number.isFinite(listed) && (
              <span className="text-xs text-gray-500">
                Room lists at {currency} {formatAmount(listed)}
                {listedIsTotal && nights ? ` for ${nights} night${nights > 1 ? 's' : ''}` : ' per night'}
              </span>
            )}
          </div>

          {hotel.amenities?.length > 0 && (
            <p className="text-xs text-gray-400 truncate mt-1">{hotel.amenities.join(' · ')}</p>
          )}
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
            aria-label={`Select ${hotel.name ?? 'hotel'}`}
          >
            {isExpanded ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>

      {isExpanded && <div className="border-t border-gray-100 bg-gray-50/60 p-5">{children}</div>}
    </div>
  );
}
