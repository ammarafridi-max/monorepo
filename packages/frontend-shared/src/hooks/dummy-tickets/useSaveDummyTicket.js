'use client';
import { useMutation } from '@tanstack/react-query';
import { createDummyTicketApi, saveDummyTicketApi } from '../../services/apiDummyTickets.js';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function storedSessionId() {
  try {
    return localStorage.getItem('SESSION_ID') || '';
  } catch {
    return '';
  }
}

async function saveTicket(payload) {
  const sessionId = storedSessionId();

  if (sessionId) {
    try {
      return await saveDummyTicketApi(sessionId, payload);
    } catch (error) {
      if (error?.status !== 404 && error?.status !== 409) throw error;
    }
  }

  return await createDummyTicketApi(payload);
}

export function useSaveDummyTicket({ onAnalytics } = {}) {
  const router = useRouter();

  const { mutate: saveDummyTicket, isPending: isSavingDummyTicket } = useMutation({
    mutationFn: saveTicket,

    onSuccess: (data, variables) => {
      if (typeof onAnalytics === 'function') {
        onAnalytics({
          passengers: variables.passengers,
          email: variables.email,
          phoneNumber: variables.phoneNumber,
          ticketValidity: variables.ticketValidity,
          flightDetails: variables.flightDetails,
        });
      }

      localStorage.setItem('SESSION_ID', data.sessionId);
      router.push('/booking/review-details');
    },

    onError: (err) => {
      toast.error(err.message);
    },
  });

  return { saveDummyTicket, isSavingDummyTicket };
}
