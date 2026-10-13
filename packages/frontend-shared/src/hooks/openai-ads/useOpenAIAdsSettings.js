'use client';
import { useQuery } from '@tanstack/react-query';
import { getOpenAIAdGroupSettingsApi, getOpenAICampaignSettingsApi } from '../../services/apiOpenAIAds.js';

export function useOpenAICampaignSettings(id) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['openai-ads', 'campaign-settings', id],
    queryFn: () => getOpenAICampaignSettingsApi(id),
    enabled: Boolean(id),
  });
  return { settings: data, isLoadingSettings: isLoading, settingsError: error };
}

export function useOpenAIAdGroupSettings(id) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['openai-ads', 'ad-group-settings', id],
    queryFn: () => getOpenAIAdGroupSettingsApi(id),
    enabled: Boolean(id),
  });
  return { settings: data, isLoadingSettings: isLoading, settingsError: error };
}
