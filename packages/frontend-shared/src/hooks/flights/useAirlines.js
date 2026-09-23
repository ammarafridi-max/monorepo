'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  deleteAirlineLogoApi,
  getAirlinesApi,
  updateAirlineLogoApi,
} from '../../services/apiFlights.js';

const KEY = ['airlines'];

export function useAirlines() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: KEY,
    queryFn: getAirlinesApi,
  });

  return {
    airlines: data ?? [],
    isLoadingAirlines: isLoading,
    isErrorAirlines: isError,
    airlinesError: error,
  };
}

export function useUpdateAirlineLogo() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateAirlineLogoApi,
    onSuccess: (airline) => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success(`${airline?.iataCode || 'Airline'} logo updated`);
    },
    onError: (err) => toast.error(err.message),
  });

  return { updateAirlineLogo: mutate, isUpdatingAirlineLogo: isPending };
}

export function useDeleteAirlineLogo() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteAirlineLogoApi,
    onSuccess: (airline) => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success(`${airline?.iataCode || 'Airline'} logo removed`);
    },
    onError: (err) => toast.error(err.message),
  });

  return { deleteAirlineLogo: mutate, isDeletingAirlineLogo: isPending };
}
