'use client';
import { useMutation } from '@tanstack/react-query';
import { getZoneByAddressApi } from '@/services/apiZones';

export function useGetZoneByAddress() {
  const { mutateAsync: getZoneByAddress, isPending: isLoadingZone } = useMutation({
    mutationFn: ({ lat, lng }) => getZoneByAddressApi({ lat, lng }),
  });

  return { getZoneByAddress, isLoadingZone };
}
