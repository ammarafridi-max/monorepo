'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { submitContactRequestApi } from '../../services/apiContact.js';

export function useSubmitContactRequest() {
  const { mutate, isPending } = useMutation({
    mutationFn: submitContactRequestApi,
    onError: (error) => {
      toast.error(
        error.message || 'Could not send your message. Please try again.',
      );
    },
  });

  return {
    submitContactRequest: mutate,
    isSubmittingContactRequest: isPending,
  };
}
