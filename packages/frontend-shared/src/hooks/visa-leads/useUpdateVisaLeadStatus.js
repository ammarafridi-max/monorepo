'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVisaLeadStatusApi } from '../../services/apiVisaLeads.js';
import toast from 'react-hot-toast';

export function useUpdateVisaLeadStatus() {
  const queryClient = useQueryClient();

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: ({ id, status }) => updateVisaLeadStatusApi(id, status),
    onSuccess: (_, { id }) => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['visa-leads', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['visa-lead', id] });
    },
    onError: (err) => {
      toast.error(`Failed to update status: ${err.message}`);
    },
  });

  return { updateStatus, isUpdatingStatus };
}
