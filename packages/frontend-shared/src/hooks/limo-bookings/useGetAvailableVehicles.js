'use client';
import { useQuery } from '@tanstack/react-query';
import { getAvailableVehiclesApi } from '../../services/apiLimoBookings.js';

export function useGetAvailableVehicles(bookingData) {
  const { tripType, pickup, dropoff, pickupDate, pickupTime, hoursBooked, distance } = bookingData || {};

  const pickupZone = pickup?.zone;
  const dropoffZone = dropoff?.zone;

  const isReady = !!pickupZone && !!tripType && !!pickupDate && !!pickupTime;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['available-vehicles', tripType, pickupZone, dropoffZone, pickupDate, pickupTime, hoursBooked, distance],
    queryFn: () =>
      getAvailableVehiclesApi({
        tripType,
        pickupZone,
        dropoffZone,
        pickupDate,
        pickupTime,
        hoursBooked,
        distance,
      }),
    enabled: isReady,
    staleTime: 1000 * 60 * 5,
  });

  return {
    vehicles: data?.vehicles || [],
    isLoadingVehicles: isLoading,
    isErrorVehicles: isError,
    errorVehicles: error,
  };
}
