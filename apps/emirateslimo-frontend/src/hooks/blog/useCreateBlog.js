'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBlogApi } from '@/services/apiBlog';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useCreateBlog() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: createBlog, isPending: isCreatingBlog } = useMutation({
    mutationFn: (formData) => createBlogApi(formData),
    onSuccess: () => {
      toast.success('Blog created successfully');
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      router.push('/admin/blogs');
    },
    onError: (err) => {
      toast.error(`Blog could not be created: ${err.message}`);
    },
  });

  return { createBlog, isCreatingBlog };
}
