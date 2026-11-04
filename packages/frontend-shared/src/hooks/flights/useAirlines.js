'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  adoptAirlineLogoApi,
  adoptHighConfidenceLogosApi,
  deleteAirlineLogoApi,
  getAirlinesApi,
  updateAirlineApi,
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

export function useUpdateAirline() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateAirlineApi,
    onSuccess: (airline) => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success(`${airline?.iataCode || 'Airline'} updated`);
    },
    onError: (err) => toast.error(err.message),
  });

  return { updateAirline: mutate, isUpdatingAirline: isPending };
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

export function useAdoptAirlineLogo() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: adoptAirlineLogoApi,
    onSuccess: (airline) => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success(`${airline?.iataCode || 'Airline'} logo saved`);
    },
    onError: (err) => toast.error(err.message),
  });

  return { adoptAirlineLogo: mutate, isAdoptingAirlineLogo: isPending };
}

export function useAdoptHighConfidenceLogos() {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: adoptHighConfidenceLogosApi,
    onSuccess: (result) => {
      if (result?.dryRun) return;
      queryClient.invalidateQueries({ queryKey: KEY });
      const adopted = result?.adopted?.length ?? 0;
      const failed = result?.failed?.length ?? 0;
      if (adopted) toast.success(`Saved ${adopted} logo${adopted === 1 ? '' : 's'}`);
      if (failed) toast.error(`${failed} could not be fetched. Try those by hand.`);
      if (!adopted && !failed) toast.success('Nothing left to approve');
    },
    onError: (err) => toast.error(err.message),
  });

  return { adoptHighConfidenceLogos: mutateAsync, isAdoptingHighConfidence: isPending };
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
