'use client';
import { useQuery } from '@tanstack/react-query';
import { getAllBlogsApi } from '@/services/apiBlog';

export function useBlogsByTag(tag, { page = 1, limit = 9 } = {}) {
  const {
    data,
    isLoading: isLoadingBlogsByTag,
    isError: isErrorBlogsByTag,
  } = useQuery({
    queryKey: ['blogs', 'published', 'tag', tag, page, limit],
    queryFn: () => getAllBlogsApi({ status: 'published', tag, page, limit }),
    enabled: Boolean(tag),
  });

  return {
    blogs: data?.blogs || [],
    pagination: data?.pagination || null,
    isLoadingBlogsByTag,
    isErrorBlogsByTag,
  };
}
