'use client';
import { useMutation } from '@tanstack/react-query';
import { publishBlogApi } from '@/services/apiBlog';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function usePublishBlog() {
  const router = useRouter();
  const { mutate: publishBlog, isPending: isPublishingBlog } = useMutation({
    mutationFn: ({ id }) => publishBlogApi(id),
    onSuccess: () => {
      toast.success('Blog published successfully');
      router.push('/admin/blogs');
    },
    onError: (err) => {
      toast.error(`Blog could not be published: ${err.message}`);
    },
  });

  return { publishBlog, isPublishingBlog };
}
