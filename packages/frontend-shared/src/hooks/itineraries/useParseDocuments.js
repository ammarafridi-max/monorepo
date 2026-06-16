'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parseDocumentsApi } from '../../services/apiItineraries.js';

// Uploads supporting documents and returns { segments, reservations } extracted
// by the AI, used to prefill the itinerary form.
export function useParseDocuments() {
  const { mutate: parseDocuments, isPending: isParsing } = useMutation({
    mutationFn: (files) => parseDocumentsApi(files),
    onError: (err) => toast.error(err.message),
  });

  return { parseDocuments, isParsing };
}
