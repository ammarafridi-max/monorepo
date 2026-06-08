'use client';
import { useMutation } from '@tanstack/react-query';
import { deleteBlogApi } from '@/services/apiBlog';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDeleteBlog() {
  const router = useRouter();
  const { mutate: deleteBlog, isPending: isDeletingBlog } = useMutation({
    mutationFn: (id) => deleteBlogApi(id),
    onSuccess: () => {
      toast.success('Blog deleted successfully');
      router.push('/admin/blogs');
    },
    onError: (err) => {
      toast.error(`Blog could not be deleted: ${err.message}`);
    },
  });

  return { deleteBlog, isDeletingBlog };
}
