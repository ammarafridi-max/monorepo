'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishBlogApi } from '../../services/apiBlog.js';
import toast from 'react-hot-toast';

export function usePublishBlog() {
  const queryClient = useQueryClient();

  const { mutate: publishBlog, isPending: isPublishingBlog } = useMutation({
    mutationFn: ({ id }) => publishBlogApi(id),
    onSuccess: () => {
      toast.success('Blog published successfully');
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (err) => {
      toast.error(`Blog could not be published: ${err.message}`);
    },
  });

  return { publishBlog, isPublishingBlog };
}
