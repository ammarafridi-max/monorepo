'use client';
import { useQuery } from '@tanstack/react-query';
import { getOpenAIAdsSetupApi } from '../../services/apiOpenAIAds.js';

export function useOpenAIAdsSetup() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['openai-ads', 'setup'],
    queryFn: getOpenAIAdsSetupApi,
    staleTime: 10 * 60_000,
  });
  return { setup: data, isLoadingSetup: isLoading, isErrorSetup: isError, setupError: error };
}
