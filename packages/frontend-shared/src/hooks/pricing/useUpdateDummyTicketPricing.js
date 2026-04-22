'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateAdminDummyTicketPricingApi } from '../../services/apiPricing.js';

export function useUpdateDummyTicketPricing() {
  const queryClient = useQueryClient();

  const { mutate: updatePricing, isPending: isUpdatingPricing } = useMutation({
    mutationFn: updateAdminDummyTicketPricingApi,
    onSuccess: () => {
      toast.success('Dummy ticket pricing updated');
      queryClient.invalidateQueries({ queryKey: ['admin-dummy-ticket-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['dummy-ticket-pricing'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update pricing');
    },
  });

  return {
    updatePricing,
    isUpdatingPricing,
  };
}
