'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updateBlogTagApi } from '../../services/apiBlogTags.js';

export function useUpdateBlogTag() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: updateBlogTag, isPending: isUpdatingBlogTag } = useMutation({
    mutationFn: ({ id, tagData }) => updateBlogTagApi(id, tagData),
    onSuccess: (_, variables) => {
      toast.success('Blog tag updated successfully');
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      queryClient.invalidateQueries({ queryKey: ['blog-tag', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      router.push('/admin/blog-tags');
    },
    onError: (err) => {
      toast.error(err.message || 'Blog tag could not be updated');
    },
  });

  return { updateBlogTag, isUpdatingBlogTag };
}
