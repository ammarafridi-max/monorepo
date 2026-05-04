'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addVisaLeadNoteApi } from '../../services/apiVisaLeads.js';
import toast from 'react-hot-toast';

export function useAddVisaLeadNote() {
  const queryClient = useQueryClient();

  const { mutate: addNote, isPending: isAddingNote } = useMutation({
    mutationFn: ({ id, text }) => addVisaLeadNoteApi(id, text),
    onSuccess: (_, { id }) => {
      toast.success('Note added');
      queryClient.invalidateQueries({ queryKey: ['visa-lead', id] });
    },
    onError: (err) => {
      toast.error(`Failed to add note: ${err.message}`);
    },
  });

  return { addNote, isAddingNote };
}
