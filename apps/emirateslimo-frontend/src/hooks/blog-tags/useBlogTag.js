'use client';
import { useQuery } from '@tanstack/react-query';
import { getBlogTagApi } from '@/services/apiBlogTags';

export function useBlogTag(id) {
  const {
    data: tag = null,
    isLoading: isLoadingBlogTag,
    isError: isErrorBlogTag,
  } = useQuery({
    queryKey: ['blog-tag', id],
    queryFn: () => getBlogTagApi(id),
    enabled: Boolean(id),
  });

  return { tag, isLoadingBlogTag, isErrorBlogTag };
}
