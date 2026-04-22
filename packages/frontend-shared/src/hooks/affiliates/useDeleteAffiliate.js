'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteAffiliateApi } from '../../services/apiAffiliates.js';

export function useDeleteAffiliate() {
  const queryClient = useQueryClient();

  const { mutate: deleteAffiliate, isPending: isDeletingAffiliate } = useMutation({
    mutationFn: (id) => deleteAffiliateApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast.success('Affiliate deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Affiliate could not be deleted');
    },
  });

  return { deleteAffiliate, isDeletingAffiliate };
}
