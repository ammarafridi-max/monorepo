'use client';
import { useMutation } from '@tanstack/react-query';
import { getCoordinatesApi } from '../../services/apiLocations.js';

export function useCoordinates() {
  const {
    mutateAsync: getCoordinates,
    isPending: isLoadingCoordinates,
    isError: isErrorCoordinates,
  } = useMutation({
    mutationFn: ({ query, id }) => getCoordinatesApi(query, id),
  });

  return { getCoordinates, isLoadingCoordinates, isErrorCoordinates };
}
