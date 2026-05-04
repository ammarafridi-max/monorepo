'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignVisaLeadApi } from '../../services/apiVisaLeads.js';
import toast from 'react-hot-toast';

export function useAssignVisaLead() {
  const queryClient = useQueryClient();

  const { mutate: assignLead, isPending: isAssigning } = useMutation({
    mutationFn: ({ id, assignedTo }) => assignVisaLeadApi(id, assignedTo),
    onSuccess: (_, { id }) => {
      toast.success('Lead assigned');
      queryClient.invalidateQueries({ queryKey: ['visa-leads', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['visa-lead', id] });
    },
    onError: (err) => {
      toast.error(`Failed to assign lead: ${err.message}`);
    },
  });

  return { assignLead, isAssigning };
}
