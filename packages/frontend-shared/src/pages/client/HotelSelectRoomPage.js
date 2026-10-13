'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useHotelContext } from '../../contexts/HotelContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useHotelOfferSearch } from '../../hooks/hotel-bookings/useHotelOfferSearch';
import { useHotelPricing, getHotelPrice } from '../../hooks/hotel-bookings/useHotelPricing';
import HotelOfferCard from '../../components/cards/HotelOfferCard';
import HotelGuestForm from '../../components/forms/v1/HotelGuestForm';
import FlightSkeleton from '../../components/shared/flight/FlightSkeleton';
import PrimaryButton from '../../components/ui/v1/PrimaryButton';

export default function HotelSelectRoomPage({ onAnalytics, searchPath = '/hotel-booking' }) {
  const router = useRouter();
  const [maxOffers, setMaxOffers] = useState(5);
  const [expandedId, setExpandedId] = useState(null);

  const { cityName, countryCode, checkIn, checkOut, occupancy, guestNationality, hydrated } = useHotelContext();
  const { selectedCurrency, formatMoney } = useCurrency();
  const { pricing } = useHotelPricing(selectedCurrency?.code);
  const { searchOffers, offers, isSearchingOffers, isErrorOffers } = useHotelOfferSearch();

  const hasSearch = Boolean(cityName && countryCode && checkIn && checkOut && guestNationality);
  const nights = checkIn && checkOut
    ? Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000)
    : null;
  // Nights do not change the fee, so one figure covers every card on the page.
  const bookingPrice = pricing ? formatMoney(getHotelPrice(pricing, 1), pricing.currency).amount : null;

  useEffect(() => {
    if (hydrated && !hasSearch) {
      toast.error('Your search expired. Please search again.');
      router.replace(searchPath);
    }
  }, [hydrated, hasSearch, router, searchPath]);

  useEffect(() => {
    if (!hydrated || !hasSearch) return;
    searchOffers({
      cityName,
      countryCode,
      checkIn,
      checkOut,
      occupancy,
      currency: selectedCurrency?.code || 'USD',
      guestNationality,
    });
  }, [hydrated, hasSearch, cityName, countryCode, checkIn, checkOut, occupancy, guestNationality, selectedCurrency?.code]);

  if (!hydrated || !hasSearch) {
    return Array.from({ length: 3 }).map((_, i) => <FlightSkeleton key={i} />);
  }

  if (isSearchingOffers) {
    return Array.from({ length: 3 }).map((_, i) => <FlightSkeleton key={i} />);
  }

  if (isErrorOffers || offers?.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center gap-5 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <SearchX size={26} className="text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">No refundable rooms on these dates</p>
            <p className="text-sm text-gray-500 mt-1">
              We only book rooms you can cancel for free, and none were available in {cityName} for those dates. Try
              different dates or a nearby city.
            </p>
          </div>
          <Link
            href={searchPath}
            className="text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
          >
            Change search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {offers?.slice(0, maxOffers).map((offer, index) => (
        <HotelOfferCard
          key={offer.offerId ?? index}
          offer={offer}
          price={bookingPrice}
          currency={selectedCurrency?.code || pricing?.currency}
          nights={nights}
          isExpanded={expandedId === index}
          onSelect={() => setExpandedId((cur) => (cur === index ? null : index))}
        >
          <HotelGuestForm offer={offer} onAnalytics={onAnalytics} />
        </HotelOfferCard>
      ))}

      {offers?.length > maxOffers && (
        <div className="text-center mt-3">
          <PrimaryButton onClick={() => setMaxOffers((cur) => cur + 5)}>Load More Rooms</PrimaryButton>
        </div>
      )}
    </>
  );
}
