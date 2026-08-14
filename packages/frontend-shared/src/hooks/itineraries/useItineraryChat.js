'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sendItineraryChatApi, getItineraryChatApi } from '../../services/apiItineraries.js';

export function useItineraryChat(sessionId) {
  const queryClient = useQueryClient();
  const [awaitingReply, setAwaitingReply] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ['itinerary-chat', sessionId],
    queryFn: () => getItineraryChatApi(sessionId),
    enabled: !!sessionId,
    refetchInterval: awaitingReply ? 2000 : false,
  });

  // The worker always appends an assistant reply, so an assistant-last history means it settled.
  useEffect(() => {
    if (!awaitingReply) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      setAwaitingReply(false);
      queryClient.invalidateQueries({ queryKey: ['itinerary', sessionId] });
    }
  }, [awaitingReply, messages, queryClient, sessionId]);

  const { mutate: sendMessage } = useMutation({
    mutationFn: (message) => sendItineraryChatApi({ sessionId, message }),
    onSuccess: (data) => {
      if (data?.messages) queryClient.setQueryData(['itinerary-chat', sessionId], data.messages);
      if (data?.meta) queryClient.setQueryData(['itinerary', sessionId], data.meta);
      setAwaitingReply(true);
    },
    onError: (err) => toast.error(err.message),
  });

  return { messages, sendMessage, isSending: awaitingReply };
}
