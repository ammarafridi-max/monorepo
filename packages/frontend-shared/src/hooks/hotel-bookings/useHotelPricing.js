'use client';
import { useQuery } from '@tanstack/react-query';
import { getHotelPricingApi } from '../../services/apiHotelBookings.js';

export function useHotelPricing(currency) {
  const { data: pricing, isLoading: isLoadingPricing } = useQuery({
    queryKey: ['hotelPricing', currency ?? null],
    queryFn: () => getHotelPricingApi(currency),
    staleTime: 5 * 60 * 1000,
  });

  return { pricing, isLoadingPricing };
}

export function getHotelPrice(pricing, nights) {
  if (!pricing) return 0;
  const extra = Math.max(0, (Number(nights) || 1) - 1);
  return pricing.basePrice + pricing.perExtraNight * extra;
}
