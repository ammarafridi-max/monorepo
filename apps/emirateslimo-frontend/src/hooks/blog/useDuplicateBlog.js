'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateBlogApi } from '@/services/apiBlog';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDuplicateBlog() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: duplicateBlog, isPending: isDuplicatingBlog } = useMutation({
    mutationFn: (id) => duplicateBlogApi(id),
    onSuccess: () => {
      toast.success('Blog duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      router.push('/admin/blogs');
    },
    onError: (err) => {
      toast.error(`Blog could not be duplicated: ${err.message}`);
    },
  });

  return { duplicateBlog, isDuplicatingBlog };
}
