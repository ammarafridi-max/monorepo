'use client';
import { useQuery } from '@tanstack/react-query';
import { getBlogBySlugApi } from '@/services/apiBlog';

export function useBlog(slug) {
  const {
    data: blog,
    isLoading: isLoadingBlog,
    isError: isErrorBlog,
  } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => getBlogBySlugApi(slug),
  });

  return { blog, isLoadingBlog, isErrorBlog };
}
