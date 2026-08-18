'use client';
import { useQuery } from '@tanstack/react-query';
import { getConversationsApi } from '../../services/apiConversations.js';

export function useConversations({ status } = {}) {
  const params = status ? { status } : {};

  const {
    data,
    isLoading: isLoadingConversations,
    isError: isErrorConversations,
  } = useQuery({
    queryKey: ['conversations', params],
    queryFn: () => getConversationsApi(params),
    placeholderData: (prev) => prev,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  return { conversations: data, isLoadingConversations, isErrorConversations };
}
