'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBlogApi } from '../../services/apiBlog.js';
import toast from 'react-hot-toast';

export function useDeleteBlog() {
  const queryClient = useQueryClient();

  const { mutate: deleteBlog, isPending: isDeletingBlog } = useMutation({
    mutationFn: (id) => deleteBlogApi(id),
    onSuccess: () => {
      toast.success('Blog deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (err) => {
      toast.error(`Blog could not be deleted: ${err.message}`);
    },
  });

  return { deleteBlog, isDeletingBlog };
}
