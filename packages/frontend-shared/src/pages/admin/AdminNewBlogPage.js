'use client';

import { useRouter } from 'next/navigation';
import BlogForm from '../../components/v1/admin/blog/BlogForm';
import { useCreateBlog } from '../../hooks/blog/useCreateBlog';

export default function AdminNewBlogPage() {
  const router = useRouter();
  const { createBlog, isCreatingBlog } = useCreateBlog();

  function handleSubmit(formData) {
    createBlog(formData, {
      onSuccess: () => router.push('/admin/blog'),
    });
  }

  return <BlogForm onSubmit={handleSubmit} isPending={isCreatingBlog} />;
}
