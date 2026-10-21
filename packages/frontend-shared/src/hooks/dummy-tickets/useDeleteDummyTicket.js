'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDummyTicketApi } from '../../services/apiDummyTickets.js';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDeleteDummyTicket({ redirectTo } = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutate: deleteDummyTicket, isPending: isDeleting } = useMutation({
    mutationFn: (sessionId) => deleteDummyTicketApi(sessionId),
    onSuccess: () => {
      toast.success('Dummy Ticket deleted successfully');
      queryClient.removeQueries({ queryKey: ['dummytickets'], exact: false });
      queryClient.removeQueries({ queryKey: ['dummyticket'], exact: false });
      if (redirectTo) router.push(redirectTo);
    },
    onError: (err) => {
      toast.error(err?.message || 'Could not delete dummy ticket');
    },
  });

  return { deleteDummyTicket, isDeleting };
}
