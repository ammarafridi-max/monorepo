'use client';
import { useQuery } from '@tanstack/react-query';
import { getBookingsApi } from '../../services/apiLimoBookings.js';

export function useGetBookings(params = {}) {
  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isError,
  } = useQuery({
    queryKey: ['limo-bookings', params],
    queryFn: () => getBookingsApi(params),
    placeholderData: (prev) => prev,
  });

  return { bookings, isLoadingBookings, isError };
}
