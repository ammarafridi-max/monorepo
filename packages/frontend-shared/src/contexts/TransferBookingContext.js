'use client';

import { createContext, useState, useRef, useCallback } from 'react';

export const TransferBookingContext = createContext(null);

const PLACEHOLDER_SEARCH = {
  pickup: { label: 'Dubai International Airport (DXB)', lat: 25.2532, lng: 55.3657 },
  dropoff: { label: 'Dubai Marina', lat: 25.0805, lng: 55.1403 },
  date: '2026-06-15',
  time: '14:30',
  passengers: 2,
  luggage: 2,
};

export function TransferBookingProvider({ children }) {
  const [pickup, setPickup]               = useState(PLACEHOLDER_SEARCH.pickup);
  const [dropoff, setDropoff]             = useState(PLACEHOLDER_SEARCH.dropoff);
  const [date, setDate]                   = useState(PLACEHOLDER_SEARCH.date);
  const [time, setTime]                   = useState(PLACEHOLDER_SEARCH.time);
  const [passengers, setPassengers]       = useState(PLACEHOLDER_SEARCH.passengers);
  const [luggage, setLuggage]             = useState(PLACEHOLDER_SEARCH.luggage);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [passengerDetails, setPassengerDetails] = useState(null);
  const [bookingId, setBookingId]         = useState(null);
  const [isPageActionRunning, setIsPageActionRunning] = useState(false);

  const pageActionRef = useRef(null);

  const registerPageAction = useCallback((fn) => {
    pageActionRef.current = fn;
  }, []);

  const unregisterPageAction = useCallback(() => {
    pageActionRef.current = null;
  }, []);

  const callPageAction = useCallback(async () => {
    if (!pageActionRef.current) return true;
    setIsPageActionRunning(true);
    try {
      return await pageActionRef.current();
    } finally {
      setIsPageActionRunning(false);
    }
  }, []);

  return (
    <TransferBookingContext.Provider
      value={{
        pickup, setPickup,
        dropoff, setDropoff,
        date, setDate,
        time, setTime,
        passengers, setPassengers,
        luggage, setLuggage,
        selectedVehicle, setSelectedVehicle,
        passengerDetails, setPassengerDetails,
        bookingId, setBookingId,
        isPageActionRunning,
        registerPageAction,
        unregisterPageAction,
        callPageAction,
      }}
    >
      {children}
    </TransferBookingContext.Provider>
  );
}
