'use client';
import { useQuery } from '@tanstack/react-query';
import { getBookingApi } from '../../services/apiLimoBookings.js';

export function useGetBooking(id, { refetchInterval } = {}) {
  const {
    data: booking,
    isLoading: isLoadingBooking,
    isError: isErrorBooking,
  } = useQuery({
    queryKey: ['limo-bookings', id],
    queryFn: () => getBookingApi(id),
    enabled: !!id,
    refetchInterval,
  });

  return { booking, isLoadingBooking, isErrorBooking };
}
