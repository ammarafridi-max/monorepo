import { useQuery } from '@tanstack/react-query';
import { getUserLocationByIpApi } from '@/services/apiLocations';

export function useUserLocationByIp() {
  const { data: userLocation, isLoading: isLoadingUserLocation } = useQuery({
    queryFn: getUserLocationByIpApi,
    queryKey: ['user-location'],
  });

  return { userLocation, isLoadingUserLocation };
}
