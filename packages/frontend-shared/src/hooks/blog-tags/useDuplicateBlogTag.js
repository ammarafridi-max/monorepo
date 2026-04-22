'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { duplicateBlogTagApi } from '../../services/apiBlogTags.js';

export function useDuplicateBlogTag() {
  const queryClient = useQueryClient();

  const { mutate: duplicateBlogTag, isPending: isDuplicatingBlogTag } = useMutation({
    mutationFn: duplicateBlogTagApi,
    onSuccess: () => {
      toast.success('Blog tag duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Blog tag could not be duplicated');
    },
  });

  return { duplicateBlogTag, isDuplicatingBlogTag };
}
