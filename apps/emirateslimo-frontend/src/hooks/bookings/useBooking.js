'use client';
import { useQuery } from '@tanstack/react-query';
import { getBookingApi } from '@/services/apiBooking';

export function useBooking(id) {
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingApi(id),
  });

  return { booking, isLoadingBooking };
}
