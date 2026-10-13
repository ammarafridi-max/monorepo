'use client';
import { useQuery } from '@tanstack/react-query';
import { getOpenAIAdsCampaignApi } from '../../services/apiOpenAIAds.js';

export function useOpenAIAdsCampaign(id, days) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['openai-ads', 'campaign', id, days],
    queryFn: () => getOpenAIAdsCampaignApi(id, days),
    enabled: Boolean(id),
    placeholderData: (prev) => prev,
  });
  return { campaign: data, isLoadingCampaign: isLoading, isErrorCampaign: isError, campaignError: error };
}
