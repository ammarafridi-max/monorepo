'use client';
import { useMutation } from '@tanstack/react-query';
import { createVisaLeadApi } from '../../services/apiVisaLeads.js';

export function useCreateVisaLead() {
  const { mutate: createVisaLead, mutateAsync: createVisaLeadAsync, isPending: isSubmittingLead } = useMutation({
    mutationFn: (data) => createVisaLeadApi(data),
  });

  return { createVisaLead, createVisaLeadAsync, isSubmittingLead };
}
