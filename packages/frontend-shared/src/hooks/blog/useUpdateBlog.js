'use client';
import { useMutation } from '@tanstack/react-query';
import { updateBlogApi } from '../../services/apiBlog.js';
import toast from 'react-hot-toast';

export function useUpdateBlog() {
  const { mutate: updateBlog, isPending: isUpdatingBlog } = useMutation({
    mutationFn: ({ id, blogData }) => updateBlogApi({ id, blogData }),
    onSuccess: () => {
      toast.success('Blog updated successfully');
    },
    onError: (err) => {
      toast.error(`Blog could not be updated: ${err.message}`);
    },
  });

  return { updateBlog, isUpdatingBlog };
}
