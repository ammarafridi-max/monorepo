'use client';
import { useQuery } from '@tanstack/react-query';
import { listBookingsApi } from '../../services/apiBookings.js';

export function useGetBookings(params = {}) {
  const { page, limit, status } = params;

  const {
    data,
    isLoading: isLoadingBookings,
    isError: isErrorBookings,
  } = useQuery({
    queryKey: ['bookings', 'list', { page, limit, status }],
    queryFn: () => listBookingsApi({ page, limit, status }),
    placeholderData: (prev) => prev,
  });

  return {
    bookings: data?.bookings ?? [],
    total: data?.total ?? 0,
    isLoadingBookings,
    isErrorBookings,
  };
}
