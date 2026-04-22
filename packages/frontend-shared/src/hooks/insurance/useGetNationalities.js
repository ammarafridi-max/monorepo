'use client';
import { useQuery } from '@tanstack/react-query';
import { getNationalities } from '../../services/apiInsurance.js';
import toast from 'react-hot-toast';

export function useGetNationalities() {
  const { data, isLoading, error } = useQuery({
    queryFn: getNationalities,
    queryKey: ['nationalities'],
    onError: (err) => {
      toast.error(err.message || 'Failed to fetch nationalities');
    },
  });

  return {
    nationalities: data,
    isLoadingNationalities: isLoading,
    error,
  };
}
