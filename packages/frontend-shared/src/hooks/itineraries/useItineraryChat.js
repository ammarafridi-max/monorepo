'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sendItineraryChatApi, getItineraryChatApi } from '../../services/apiItineraries.js';

// Conversational AI editing of a pre-payment itinerary. The edit runs in the
// background server-side (same async pattern as generate/regenerate), so sending
// a message returns immediately with the user message recorded and the order in
// GENERATING. We then poll the chat history until the assistant reply lands, and
// refresh the order meta (preview cache-bust + budget counter) once it settles.
export function useItineraryChat(sessionId) {
  const queryClient = useQueryClient();
  const [awaitingReply, setAwaitingReply] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ['itinerary-chat', sessionId],
    queryFn: () => getItineraryChatApi(sessionId),
    enabled: !!sessionId,
    // Poll only while a background edit is in flight.
    refetchInterval: awaitingReply ? 2000 : false,
  });

  // The background worker always appends an assistant reply when it finishes
  // (success or graceful failure). Once the latest message is from the assistant,
  // the edit has settled — stop polling and refresh the order meta so the preview
  // image (new previewVersion) and the chat budget update.
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
      // data: { messages (incl. the new user message), meta (status GENERATING) }
      if (data?.messages) queryClient.setQueryData(['itinerary-chat', sessionId], data.messages);
      if (data?.meta) queryClient.setQueryData(['itinerary', sessionId], data.meta);
      setAwaitingReply(true);
    },
    onError: (err) => toast.error(err.message),
  });

  return { messages, sendMessage, isSending: awaitingReply };
}
