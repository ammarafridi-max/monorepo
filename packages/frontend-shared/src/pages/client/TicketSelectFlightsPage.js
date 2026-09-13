'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FlightCard from '../../components/shared/flight/FlightCard';
import FlightError from '../../components/shared/flight/FlightError';
import FlightSkeleton from '../../components/shared/flight/FlightSkeleton';
import PrimaryButton from '../../components/ui/v1/PrimaryButton';
import { TicketContext } from '../../contexts/TicketContext';
import { useFlights } from '../../hooks/flights/useFlights';
import { useDummyTicketPricing } from '../../hooks/pricing/useDummyTicketPricing';
import { normalizePricingOptions } from '../../utils/dummyTicketPricing';
import { transformItinerary } from '../../utils/transformItinerary';
import { formatDate } from '../../utils/dates';
import { trackSelectFlight } from '../../utils/analytics';

export default function TicketSelectFlightsPage({ supportEmail, searchPath = '/' }) {
  const router = useRouter();
  const [maxFlights, setMaxFlights] = useState(5);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const {
    type,
    from,
    to,
    departureDate,
    returnDate,
    quantity,
    ticketValidity,
    hydrated,
    setDepartureFlight,
    setReturnFlight,
    setPassengers,
    initializePassengers,
  } = useContext(TicketContext);
  const hasSearch = Boolean(from && to && departureDate);
  const { flights, isLoadingFlights, isErrorFlights, flightsError } = useFlights({
    type,
    from,
    to,
    departureDate,
    returnDate,
    quantity,
  });
  const { pricing } = useDummyTicketPricing();
  const options = normalizePricingOptions(pricing);

  useEffect(() => {
    if (hydrated && !hasSearch) {
      toast.error('Your search expired. Please search again.');
      router.replace(searchPath);
    }
  }, [hydrated, hasSearch, router, searchPath]);

  const handleToggleExpand = id => {
    setExpandedCardId(prevId => (prevId === id ? null : id));
  };

  function handleSelectFlight(flight, index) {
    handleToggleExpand(index);
    setDepartureFlight(transformItinerary(flight.itineraries[0]));
    if (type === 'Return' && flight.itineraries[1]) {
      setReturnFlight(transformItinerary(flight.itineraries[1]));
    }
    const firstSegment = flight.itineraries?.[0]?.segments?.[0];
    trackSelectFlight({
      tripType: type,
      carrierCode: firstSegment?.carrierCode,
      flightNumber: firstSegment?.flightNumber,
      ticketValidity,
      price: options.find((o) => o.value === ticketValidity)?.price,
      index,
    });
  }

  useEffect(() => {
    if (quantity) {
      initializePassengers(quantity, setPassengers);
    }
  }, [initializePassengers, quantity, setPassengers]);

  if (!hydrated || !hasSearch) {
    return Array.from({ length: 3 }).map((_, i) => <FlightSkeleton key={i} />);
  }

  const noFlights =
    (!isLoadingFlights && !isErrorFlights && flights?.length === 0) || flightsError?.status === 404;

  if (noFlights) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center gap-5 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <SearchX size={26} className="text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">No flights on this date</p>
            <p className="text-sm text-gray-500 mt-1">
              We found no flights from {from} to {to} on {formatDate(departureDate)}. Try another date, a nearby
              airport, or a one way search.
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
      {isLoadingFlights && Array.from({ length: 3 }).map((_, i) => <FlightSkeleton key={i} />)}

      {isErrorFlights && <FlightError email={supportEmail} />}

      {flights?.length > 0 && (
        <>
          {flights.slice(0, maxFlights).map((flight, index) => (
            <FlightCard
              key={index}
              flight={flight}
              isExpanded={expandedCardId === index}
              onSelectFlight={() => handleSelectFlight(flight, index)}
            />
          ))}
          {flights.length > maxFlights && (
            <div className="text-center mt-3">
              <PrimaryButton
                onClick={() => {
                  if (maxFlights < flights?.length) {
                    setMaxFlights(cur => cur + 5);
                  }
                }}
              >
                Load More Flights
              </PrimaryButton>
            </div>
          )}
        </>
      )}
    </>
  );
}
