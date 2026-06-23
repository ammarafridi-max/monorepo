'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sendReservationApi } from '../../services/apiDummyTickets.js';

export function useSendReservation() {
  const queryClient = useQueryClient();
  const { mutate: sendReservation, mutateAsync: sendReservationAsync, isPending: isSending } = useMutation({
    mutationFn: sendReservationApi,
    onSuccess: () => {
      toast.success('Reservation sent to the customer.');
      queryClient.invalidateQueries({ queryKey: ['dummytickets'] });
      queryClient.invalidateQueries({ queryKey: ['dummyticket'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Could not send reservation.');
    },
  });

  return { sendReservation, sendReservationAsync, isSending };
}
