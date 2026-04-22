'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteBlogTagApi } from '../../services/apiBlogTags.js';

export function useDeleteBlogTag() {
  const queryClient = useQueryClient();

  const { mutate: deleteBlogTag, isPending: isDeletingBlogTag } = useMutation({
    mutationFn: deleteBlogTagApi,
    onSuccess: () => {
      toast.success('Blog tag deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Blog tag could not be deleted');
    },
  });

  return { deleteBlogTag, isDeletingBlogTag };
}
