'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDeliveryDateApi } from '../../services/apiDummyTickets.js';
import toast from 'react-hot-toast';

export function useUpdateDeliveryDate() {
  const queryClient = useQueryClient();
  const { mutate: updateDeliveryDate, isPending: isUpdatingDelivery } = useMutation({
    mutationFn: updateDeliveryDateApi,
    onSuccess: () => {
      toast.success('Delivery date updated.');
      queryClient.invalidateQueries({ queryKey: ['dummytickets'] });
      queryClient.invalidateQueries({ queryKey: ['dummyticket'] });
    },
    // Surface the server message (e.g. validation errors) rather than a
    // generic string — the delivery-date rules are meaningful to the agent.
    onError: (err) => {
      toast.error(err?.message || 'An error occurred.');
    },
  });

  return { updateDeliveryDate, isUpdatingDelivery };
}
