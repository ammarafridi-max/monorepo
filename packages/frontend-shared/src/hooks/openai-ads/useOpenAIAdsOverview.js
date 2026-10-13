'use client';
import { useQuery } from '@tanstack/react-query';
import { getOpenAIAdsOverviewApi } from '../../services/apiOpenAIAds.js';

export function useOpenAIAdsOverview(days) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['openai-ads', 'overview', days],
    queryFn: () => getOpenAIAdsOverviewApi({ days }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  return { overview: data, isLoadingOverview: isLoading, isErrorOverview: isError, overviewError: error };
}
