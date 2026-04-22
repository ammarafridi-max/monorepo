'use client';
import { useQuery } from '@tanstack/react-query';
import { getBlogBySlugApi } from '../../services/apiBlog.js';

export function useGetBlogBySlug(slug) {
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
