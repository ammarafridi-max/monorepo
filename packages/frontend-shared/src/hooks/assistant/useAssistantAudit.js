'use client';
import { useQuery } from '@tanstack/react-query';
import { getAssistantAuditApi, getAssistantUsageApi } from '../../services/apiAssistant.js';

export function useAssistantAudit(params = {}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['assistant-audit', params],
    queryFn: () => getAssistantAuditApi(params),
    placeholderData: (prev) => prev,
    retry: false,
  });

  return {
    calls: data?.calls || [],
    pagination: data?.pagination,
    isLoadingAudit: isLoading,
    isErrorAudit: isError,
  };
}

export function useAssistantUsage(days = 30) {
  const { data, isLoading } = useQuery({
    queryKey: ['assistant-usage', days],
    queryFn: () => getAssistantUsageApi(days),
    retry: false,
  });

  return { usage: data, isLoadingUsage: isLoading };
}
