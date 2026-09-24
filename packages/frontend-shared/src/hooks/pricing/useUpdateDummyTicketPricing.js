'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  updateAdminDummyTicketPricingApi,
  deleteAdminDummyTicketPricingApi,
} from '../../services/apiPricing.js';

function invalidatePricing(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['admin-dummy-ticket-pricing'] });
  queryClient.invalidateQueries({ queryKey: ['admin-dummy-ticket-price-books'] });
  queryClient.invalidateQueries({ queryKey: ['dummy-ticket-pricing'] });
}

export function useUpdateDummyTicketPricing() {
  const queryClient = useQueryClient();

  const { mutate: updatePricing, isPending: isUpdatingPricing } = useMutation({
    mutationFn: updateAdminDummyTicketPricingApi,
    onSuccess: (data) => {
      toast.success(`${data?.currency || 'Dummy ticket'} pricing updated`);
      invalidatePricing(queryClient);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update pricing');
    },
  });

  return { updatePricing, isUpdatingPricing };
}

export function useDeleteDummyTicketPricing() {
  const queryClient = useQueryClient();

  const { mutate: deletePricing, isPending: isDeletingPricing } = useMutation({
    mutationFn: deleteAdminDummyTicketPricingApi,
    onSuccess: (data) => {
      toast.success(`${data?.currency} price book removed`);
      invalidatePricing(queryClient);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove price book');
    },
  });

  return { deletePricing, isDeletingPricing };
}
