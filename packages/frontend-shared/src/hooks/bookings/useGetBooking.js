'use client';
import { useQuery } from '@tanstack/react-query';
import { getBookingApi } from '../../services/apiBookings.js';

export function useGetBooking(id) {
  const {
    data: booking,
    isLoading: isLoadingBooking,
    isError: isErrorBooking,
  } = useQuery({
    queryKey: ['bookings', 'detail', id],
    queryFn: () => getBookingApi(id),
    enabled: !!id,
  });

  return { booking, isLoadingBooking, isErrorBooking };
}
