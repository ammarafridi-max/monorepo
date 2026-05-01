'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sendReplyApi } from '../../services/apiEmailSupport.js';

export function useSendEmailReply() {
  const queryClient = useQueryClient();

  const { mutate: sendReply, isPending: isSendingReply } = useMutation({
    mutationFn: (id) => sendReplyApi(id),
    onSuccess: () => {
      toast.success('Reply sent successfully');
      queryClient.invalidateQueries({ queryKey: ['email-support'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send reply');
    },
  });

  return { sendReply, isSendingReply };
}
