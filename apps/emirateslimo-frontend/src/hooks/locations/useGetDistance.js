import { useMutation } from '@tanstack/react-query';
import { getDistanceApi } from '@/services/apiLocations';

export function useGetDistance() {
  const {
    mutateAsync: getDistance,
    data: distanceData,
    isPending: isLoadingDistance,
    isError,
    error,
  } = useMutation({
    mutationFn: ({ originLat, originLng, destLat, destLng }) =>
      getDistanceApi({ originLat, originLng, destLat, destLng }),
  });

  return {
    getDistance,
    distanceData,
    isLoadingDistance,
    isError,
    error,
  };
}
