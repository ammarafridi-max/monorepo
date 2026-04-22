'use client';
import { useQuery } from '@tanstack/react-query';
import { getBlogTagsApi } from '../../services/apiBlogTags.js';

export function useGetBlogTags(search = '') {
  const {
    data: tags = [],
    isLoading: isLoadingBlogTags,
    isError: isErrorBlogTags,
  } = useQuery({
    queryKey: ['blog-tags', search],
    queryFn: () => getBlogTagsApi(search),
  });

  return { tags, isLoadingBlogTags, isErrorBlogTags };
}
