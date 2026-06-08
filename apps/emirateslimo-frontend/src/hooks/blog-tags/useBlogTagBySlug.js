'use client';
import { useQuery } from '@tanstack/react-query';
import { getBlogTagBySlugApi } from '@/services/apiBlogTags';

export function useBlogTagBySlug(slug) {
  const {
    data: tag = null,
    isLoading: isLoadingBlogTag,
    isError: isErrorBlogTag,
  } = useQuery({
    queryKey: ['blog-tag', 'slug', slug],
    queryFn: () => getBlogTagBySlugApi(slug),
    enabled: Boolean(slug),
  });

  return { tag, isLoadingBlogTag, isErrorBlogTag };
}
