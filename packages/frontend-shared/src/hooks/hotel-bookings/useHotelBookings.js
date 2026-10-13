'use client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getHotelBookingsApi } from '../../services/apiHotelBookings.js';

export function useHotelBookings(overrides, options = {}) {
  const searchParams = useSearchParams();
  const params = overrides ?? Object.fromEntries([...searchParams]);

  const {
    data,
    isLoading: isLoadingReservations,
    isError: isErrorReservations,
  } = useQuery({
    queryKey: ['hotelBookings', params],
    queryFn: () => getHotelBookingsApi(params),
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
    ...options,
  });

  return {
    reservations: data?.data,
    pagination: data?.pagination,
    isLoadingReservations,
    isErrorReservations,
  };
}
