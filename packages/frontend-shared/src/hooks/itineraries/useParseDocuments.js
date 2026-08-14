'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parseDocumentsApi } from '../../services/apiItineraries.js';

export function useParseDocuments() {
  const { mutate: parseDocuments, isPending: isParsing } = useMutation({
    mutationFn: (files) => parseDocumentsApi(files),
    onError: (err) => toast.error(err.message),
  });

  return { parseDocuments, isParsing };
}
