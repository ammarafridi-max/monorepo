'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDummyTicketApi } from '../../services/apiDummyTickets.js';
import toast from 'react-hot-toast';

export function useUpdateDummyTicket() {
  const queryClient = useQueryClient();
  const { mutate: updateDummyTicket, isPending: isUpdating } = useMutation({
    mutationFn: updateDummyTicketApi,
    onSuccess: () => {
      toast.success('Dummy ticket updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['dummytickets'] });
      queryClient.invalidateQueries({ queryKey: ['dummyticket'] });
    },
    onError: () => {
      toast.error('An error occurred.');
    },
  });

  return { updateDummyTicket, isUpdating };
}
