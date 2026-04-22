'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createBlogTagApi } from '../../services/apiBlogTags.js';

export function useCreateBlogTag() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: createBlogTag, isPending: isCreatingBlogTag } = useMutation({
    mutationFn: createBlogTagApi,
    onSuccess: () => {
      toast.success('Blog tag created successfully');
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      router.push('/admin/blog-tags');
    },
    onError: (err) => {
      toast.error(err.message || 'Blog tag could not be created');
    },
  });

  return { createBlogTag, isCreatingBlogTag };
}
