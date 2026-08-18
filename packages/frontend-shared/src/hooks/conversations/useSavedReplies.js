'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getSavedRepliesApi,
  createSavedReplyApi,
  deleteSavedReplyApi,
} from '../../services/apiConversations.js';

export function useSavedReplies() {
  const queryClient = useQueryClient();

  const { data: savedReplies = [], isLoading: isLoadingSavedReplies } = useQuery({
    queryKey: ['saved-replies'],
    queryFn: getSavedRepliesApi,
    staleTime: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['saved-replies'] });

  const { mutate: createSavedReply, isPending: isCreatingSavedReply } = useMutation({
    mutationFn: createSavedReplyApi,
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message || 'Could not save the reply'),
  });

  const { mutate: deleteSavedReply } = useMutation({
    mutationFn: deleteSavedReplyApi,
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message || 'Could not delete the reply'),
  });

  return { savedReplies, isLoadingSavedReplies, createSavedReply, isCreatingSavedReply, deleteSavedReply };
}
