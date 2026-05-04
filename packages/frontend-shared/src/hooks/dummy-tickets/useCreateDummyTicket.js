'use client';
import { useMutation } from '@tanstack/react-query';
import { createDummyTicketApi } from '../../services/apiDummyTickets.js';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useCreateDummyTicket({ onAnalytics } = {}) {
  const router = useRouter();

  const { mutate: createDummyTicket, isPending: isCreatingDummyTicket } = useMutation({
    mutationFn: ({
      type,
      from,
      to,
      departureDate,
      returnDate,
      quantity,
      passengers,
      email,
      phoneNumber,
      message,
      ticketValidity,
      currency,
      affiliateId,
      affiliateCapturedAt,
      ticketDelivery,
      flightDetails,
      paymentStatus = 'UNPAID',
    }) =>
      createDummyTicketApi({
        type,
        from,
        to,
        departureDate,
        returnDate,
        quantity,
        passengers,
        email,
        phoneNumber,
        message,
        ticketValidity,
        currency,
        affiliateId,
        affiliateCapturedAt,
        ticketDelivery,
        flightDetails,
        paymentStatus,
      }),

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

  return { createDummyTicket, isCreatingDummyTicket };
}
