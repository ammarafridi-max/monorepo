'use client';
import { useMutation } from '@tanstack/react-query';
import { deleteBookingApi } from '@/services/apiBooking';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDeleteBooking() {
  const router = useRouter();
  const { mutate: deleteBooking, isPending: isDeletingBooking } = useMutation({
    mutationFn: (id) => deleteBookingApi(id),
    onSuccess: () => {
      toast.success('Booking deleted');
      router.push('/admin/bookings');
    },
    onError: () => {
      toast.error('Booking could not be deleted');
    },
  });

  return { deleteBooking, isDeletingBooking };
}
