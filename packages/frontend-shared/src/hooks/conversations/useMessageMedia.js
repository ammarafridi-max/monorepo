'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMessageMediaApi } from '../../services/apiConversations.js';

// Blobs are fetched through the API so customer attachments stay behind admin auth.
export function useMessageMedia(messageId, { enabled = true } = {}) {
  const { data: url, isLoading, isError, error } = useQuery({
    queryKey: ['message-media', messageId],
    queryFn: async () => URL.createObjectURL(await getMessageMediaApi(messageId)),
    enabled: Boolean(messageId) && enabled,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  return { url, isLoadingMedia: isLoading, isErrorMedia: isError, mediaError: error };
}
