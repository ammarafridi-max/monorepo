'use client';
import { useQuery } from '@tanstack/react-query';
import { getAllPricingRulesApi } from '@/services/apiPricingRule';
import { useSearchParams } from 'next/navigation';

export function usePricingRules() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const pickupZoneId = searchParams.get('pickupZoneId');
  const dropoffZoneId = searchParams.get('dropoffZoneId');
  const name = searchParams.get('name');

  const filters = {
    vehicleId: vehicleId !== 'all' ? vehicleId : undefined,
    pickupZoneId: pickupZoneId !== 'all' ? pickupZoneId : undefined,
    dropoffZoneId: dropoffZoneId !== 'all' ? dropoffZoneId : undefined,
    name: name || undefined,
  };

  const {
    data: pricingRules,
    isLoading: isLoadingPricingRules,
    isError,
    error,
  } = useQuery({
    queryKey: ['pricing-rules', filters],
    queryFn: () => getAllPricingRulesApi(filters),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  return {
    pricingRules: pricingRules ?? [],
    isLoadingPricingRules,
    isError,
    error,
  };
}
