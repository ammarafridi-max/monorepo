'use client';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../services/apiClient.js';
import toast from 'react-hot-toast';

export function useCreateNationalities() {
  const { mutate, isPending } = useMutation({
    mutationFn: () => apiFetch('/api/insurance/nationalities', { method: 'POST' }),
    onSuccess: () => toast.success('Nationalities refreshed successfully'),
    onError: (err) => toast.error(err.message || 'Failed to refresh nationalities'),
  });

  return { createNationalities: mutate, isCreatingNationalities: isPending };
}
