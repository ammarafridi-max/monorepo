import { useMutation } from '@tanstack/react-query';
import { getLatLngApi } from '@/services/apiLocations';

export function useGetLatLng() {
  const { mutateAsync: getCoordinates, isLoading: isLoadingCoordinates } =
    useMutation({
      mutationFn: ({ query, id }) => getLatLngApi(query, id),
    });

  return { getCoordinates, isLoadingCoordinates };
}
