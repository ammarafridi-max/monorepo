'use client';
import { useQuery } from '@tanstack/react-query';
import { getPublishedBlogsApi } from '../../services/apiBlog.js';

export function useGetPublishedBlogs({ page = 1, limit = 9 } = {}) {
  const {
    data,
    isLoading: isLoadingBlogs,
    isError: isErrorBlogs,
  } = useQuery({
    queryKey: ['blogs', 'published', page, limit],
    queryFn: () => getPublishedBlogsApi({ page, limit }),
  });

  return {
    blogs: data?.blogs || [],
    pagination: data?.pagination || null,
    isLoadingBlogs,
    isErrorBlogs,
  };
}
