'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sendItineraryChatApi, getItineraryChatApi } from '../../services/apiItineraries.js';

// Conversational AI editing of a pre-payment itinerary. Loads the persisted
// conversation, and sends new messages. On success it updates both the chat
// history and the order meta (so the preview image cache-busts and the budget
// counter refreshes).
export function useItineraryChat(sessionId) {
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['itinerary-chat', sessionId],
    queryFn: () => getItineraryChatApi(sessionId),
    enabled: !!sessionId,
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (message) => sendItineraryChatApi({ sessionId, message }),
    onSuccess: (data) => {
      if (data?.messages) queryClient.setQueryData(['itinerary-chat', sessionId], data.messages);
      if (data?.meta) queryClient.setQueryData(['itinerary', sessionId], data.meta);
    },
    onError: (err) => toast.error(err.message),
  });

  return { messages, sendMessage, isSending };
}
