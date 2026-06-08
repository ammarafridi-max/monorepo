'use client';
import { useQuery } from '@tanstack/react-query';
import { getBookingsApi } from '@/services/apiBooking';

export function useBookings() {
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryFn: getBookingsApi,
    queryKey: ['bookings'],
  });

  return { bookings, isLoadingBookings };
}
