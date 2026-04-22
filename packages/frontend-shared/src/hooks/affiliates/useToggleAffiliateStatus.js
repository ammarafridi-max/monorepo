'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateAffiliateApi } from '../../services/apiAffiliates.js';

export function useToggleAffiliateStatus() {
  const queryClient = useQueryClient();

  const { mutate: toggleAffiliateStatus, isPending: isTogglingAffiliateStatus } = useMutation({
    mutationFn: ({ id, isActive }) => updateAffiliateApi(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast.success('Affiliate status updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Affiliate status could not be updated');
    },
  });

  return { toggleAffiliateStatus, isTogglingAffiliateStatus };
}
