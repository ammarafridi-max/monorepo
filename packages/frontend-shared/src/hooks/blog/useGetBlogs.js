'use client';
import { useQuery } from '@tanstack/react-query';
import { getAllBlogsApi } from '../../services/apiBlog.js';

export function useGetBlogs({ page = 1, limit = 10, status, tag, search, author } = {}) {
  const {
    data,
    isLoading: isLoadingBlogs,
    isError: isErrorBlogs,
  } = useQuery({
    queryKey: ['blogs', page, limit, status, tag, search, author],
    queryFn: () => getAllBlogsApi({ page, limit, status, tag, search, author }),
  });

  const blogs = data?.blogs || [];
  const pagination = data?.pagination || null;

  return { blogs, pagination, isLoadingBlogs, isErrorBlogs };
}
