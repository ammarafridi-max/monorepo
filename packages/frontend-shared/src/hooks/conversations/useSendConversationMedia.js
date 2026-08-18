'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sendConversationMediaApi } from '../../services/apiConversations.js';

export function useSendConversationMedia() {
  const queryClient = useQueryClient();

  const { mutate: sendMedia, isPending: isSendingMedia } = useMutation({
    mutationFn: sendConversationMediaApi,
    onSuccess: (_data, { waId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', waId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err) => toast.error(err.message || 'Could not send the file'),
  });

  return { sendMedia, isSendingMedia };
}
