'use client';
import { useQuery } from '@tanstack/react-query';
import { getHotelBookingApi } from '../../services/apiHotelBookings.js';

export function useHotelBooking(sessionId, options = {}) {
  const {
    data: reservation,
    isLoading: isLoadingReservation,
    isError: isErrorReservation,
  } = useQuery({
    queryKey: ['hotelBooking', sessionId],
    queryFn: () => getHotelBookingApi(sessionId),
    enabled: Boolean(sessionId),
    refetchOnMount: 'always',
    ...options,
  });

  return { reservation, isLoadingReservation, isErrorReservation };
}
