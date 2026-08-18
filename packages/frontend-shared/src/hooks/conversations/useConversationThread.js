'use client';
import { useQuery } from '@tanstack/react-query';
import { getConversationThreadApi } from '../../services/apiConversations.js';

export function useConversationThread(waId) {
  const {
    data,
    isLoading: isLoadingThread,
    isError: isErrorThread,
  } = useQuery({
    queryKey: ['conversation', waId],
    queryFn: () => getConversationThreadApi(waId),
    enabled: Boolean(waId),
    placeholderData: (prev) => prev,
    refetchInterval: 10_000,
    staleTime: 0,
  });

  return {
    conversation: data?.conversation,
    messages: data?.messages,
    isLoadingThread,
    isErrorThread,
  };
}
