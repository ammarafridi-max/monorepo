'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAssignableAgentsApi,
  claimConversationApi,
  assignConversationApi,
} from '../../services/apiConversations.js';

export function useAssignableAgents() {
  const { data: agents = [] } = useQuery({
    queryKey: ['conversation-agents'],
    queryFn: getAssignableAgentsApi,
    staleTime: 300_000,
  });
  return { agents };
}

export function useConversationAssignment() {
  const queryClient = useQueryClient();

  const refresh = (waId) => {
    queryClient.invalidateQueries({ queryKey: ['conversation', waId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const { mutate: claimConversation } = useMutation({
    mutationFn: claimConversationApi,
    onSuccess: (_data, waId) => refresh(waId),
  });

  const { mutate: assignConversation, isPending: isAssigning } = useMutation({
    mutationFn: assignConversationApi,
    onSuccess: (_data, { waId }) => refresh(waId),
    onError: (err) => toast.error(err.message || 'Could not reassign the chat'),
  });

  return { claimConversation, assignConversation, isAssigning };
}
