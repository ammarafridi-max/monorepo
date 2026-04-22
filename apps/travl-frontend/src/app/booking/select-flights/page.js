'use client';

import { useContext, useEffect, useState } from 'react';
import FlightCard from '@travel-suite/frontend-shared/components/v1/flight/FlightCard';
import FlightError from '@travel-suite/frontend-shared/components/v1/flight/FlightError';
import FlightSkeleton from '@travel-suite/frontend-shared/components/v1/flight/FlightSkeleton';
import PrimaryButton from '@travel-suite/frontend-shared/components/v1/PrimaryButton';
import { TicketContext } from '@travel-suite/frontend-shared/contexts/TicketContext';
import { useFlights } from '@travel-suite/frontend-shared/hooks/useFlights';
import { transformItinerary } from '@travel-suite/frontend-shared/utils/transformItinerary';

export default function Page() {
  const [maxFlights, setMaxFlights] = useState(5);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const {
    type,
    from,
    to,
    departureDate,
    returnDate,
    quantity,
    setDepartureFlight,
    setReturnFlight,
    setPassengers,
    initializePassengers,
  } = useContext(TicketContext);
  const { flights, isLoadingFlights, isErrorFlights } = useFlights({
    type,
    from,
    to,
    departureDate,
    returnDate,
    quantity,
  });

  const handleToggleExpand = id => {
    setExpandedCardId(prevId => (prevId === id ? null : id));
  };

  function handleSelectFlight(flight, index) {
    handleToggleExpand(index);
    setDepartureFlight(transformItinerary(flight.itineraries[0]));
    if (type === 'Return' && flight.itineraries[1]) {
      setReturnFlight(transformItinerary(flight.itineraries[1]));
    }
  }

  useEffect(() => {
    if (quantity) {
      initializePassengers(quantity, setPassengers);
    }
  }, [initializePassengers, quantity, setPassengers]);

  if (!isLoadingFlights && !isErrorFlights && flights?.length === 0) {
    throw new Error('No flights available for this route.');
  }

  return (
    <>
      {isLoadingFlights && Array.from({ length: 3 }).map((_, i) => <FlightSkeleton key={i} />)}

      {isErrorFlights && <FlightError />}

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
