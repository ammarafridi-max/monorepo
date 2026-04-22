'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDummyTicketApi } from '../../services/apiDummyTickets.js';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDeleteDummyTicket() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutate: deleteDummyTicket, isPending: isDeleting } = useMutation({
    mutationFn: (sessionId) => deleteDummyTicketApi(sessionId),
    onSuccess: () => {
      toast.success('Dummy Ticket deleted successfully');
      queryClient.removeQueries({ queryKey: ['dummytickets'], exact: false });
      queryClient.removeQueries({ queryKey: ['dummyticket'], exact: false });
      setTimeout(() => {
        router.push('/admin/dummy-tickets');
      }, 2000);
    },
    onError: () => {
      toast.error('Could not delete dummy ticket');
    },
  });

  return { deleteDummyTicket, isDeleting };
}
