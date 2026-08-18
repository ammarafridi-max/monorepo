'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markConversationReadApi } from '../../services/apiConversations.js';

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  const { mutate: markConversationRead } = useMutation({
    mutationFn: markConversationReadApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  return { markConversationRead };
}
