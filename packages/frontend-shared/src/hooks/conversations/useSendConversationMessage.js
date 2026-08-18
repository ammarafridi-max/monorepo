'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sendConversationMessageApi } from '../../services/apiConversations.js';

export function useSendConversationMessage() {
  const queryClient = useQueryClient();

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: sendConversationMessageApi,
    onSuccess: (_data, { waId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', waId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err) => toast.error(err.message || 'Could not send the message'),
  });

  return { sendMessage, isSending };
}
