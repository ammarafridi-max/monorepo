'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  deleteAssistantConversationApi,
  getAssistantConversationsApi,
} from '../../services/apiAssistant.js';

export function useAssistantConversations({ enabled = true } = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ['assistant-conversations'],
    queryFn: getAssistantConversationsApi,
    enabled,
    retry: false,
  });

  return { conversations: data || [], isLoadingConversations: isLoading };
}

export function useDeleteAssistantConversation() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteAssistantConversationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
    },
    onError: (error) => toast.error(error.message),
  });

  return { deleteConversation: mutate, deletingConversation: isPending };
}
