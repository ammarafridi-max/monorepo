'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { refundDummyTicketApi } from '../../services/apiDummyTickets.js';
import toast from 'react-hot-toast';

export function useRefundDummyTicket() {
  const queryClient = useQueryClient();
  const { mutate: refundDummyTicket, isPending: isRefunding } = useMutation({
    mutationFn: (transactionId) => refundDummyTicketApi(transactionId),
    onSuccess: () => {
      toast.success('Refund successful');
      queryClient.invalidateQueries({ queryKey: ['dummytickets'] });
      queryClient.invalidateQueries({ queryKey: ['dummyticket'] });
    },
    onError: (err) => toast.error(err.message || 'Could not refund'),
  });

  return { refundDummyTicket, isRefunding };
}
