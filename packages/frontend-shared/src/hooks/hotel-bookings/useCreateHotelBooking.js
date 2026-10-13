'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createHotelBookingApi } from '../../services/apiHotelBookings.js';

export function useCreateHotelBooking({ onAnalytics } = {}) {
  const router = useRouter();

  const { mutate: createHotelBooking, isPending: isCreatingHotelBooking } = useMutation({
    mutationFn: createHotelBookingApi,
    onSuccess: (data, variables) => {
      onAnalytics?.(variables);
      localStorage.setItem('HOTEL_SESSION_ID', data.sessionId);
      router.push('/hotel-booking/review-details');
    },
    onError: (err) => toast.error(err.message),
  });

  return { createHotelBooking, isCreatingHotelBooking };
}
