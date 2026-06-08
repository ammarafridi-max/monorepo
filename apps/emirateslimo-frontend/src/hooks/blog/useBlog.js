'use client';
import { useQuery } from '@tanstack/react-query';
import { getBlogByIdApi } from '@/services/apiBlog';

export function useBlog(id) {
  const {
    data,
    isLoading: isLoadingBlog,
    isError: isErrorBlog,
  } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => getBlogByIdApi(id),
    enabled: !!id,
  });

  const blog = data?.blog || data || null;

  return { blog, isLoadingBlog, isErrorBlog };
}
