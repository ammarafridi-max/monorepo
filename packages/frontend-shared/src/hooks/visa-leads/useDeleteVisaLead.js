'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVisaLeadApi } from '../../services/apiVisaLeads.js';
import toast from 'react-hot-toast';

export function useDeleteVisaLead() {
  const queryClient = useQueryClient();

  const { mutate: deleteLead, isPending: isDeletingLead } = useMutation({
    mutationFn: (id) => deleteVisaLeadApi(id),
    onSuccess: () => {
      toast.success('Lead deleted');
      queryClient.invalidateQueries({ queryKey: ['visa-leads', 'admin'] });
    },
    onError: (err) => {
      toast.error(`Failed to delete lead: ${err.message}`);
    },
  });

  return { deleteLead, isDeletingLead };
}
