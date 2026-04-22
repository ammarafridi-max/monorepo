'use client';

import { useRouter } from 'next/navigation';
import BlogForm from '@travel-suite/frontend-shared/components/v1/admin/blog/BlogForm';
import { useCreateBlog } from '@travel-suite/frontend-shared/hooks/blog/useCreateBlog';

export default function NewBlogPage() {
  const router = useRouter();
  const { createBlog, isCreatingBlog } = useCreateBlog();

  function handleSubmit(formData) {
    createBlog(formData, {
      onSuccess: () => router.push('/admin/blog'),
    });
  }

  return <BlogForm onSubmit={handleSubmit} isPending={isCreatingBlog} />;
}
