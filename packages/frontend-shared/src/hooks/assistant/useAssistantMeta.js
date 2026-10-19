'use client';
import { useQuery } from '@tanstack/react-query';
import { getAssistantMetaApi } from '../../services/apiAssistant.js';

export function useAssistantMeta() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['assistant-meta'],
    queryFn: getAssistantMetaApi,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });

  return {
    meta: data ?? null,
    assistantAvailable: Boolean(data) && !isError,
    isLoadingAssistantMeta: isLoading,
  };
}
