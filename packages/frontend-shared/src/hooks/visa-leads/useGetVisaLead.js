'use client';
import { useQuery } from '@tanstack/react-query';
import { getVisaLeadByIdApi } from '../../services/apiVisaLeads.js';

export function useGetVisaLead(id) {
  const { data: lead, isLoading: isLoadingLead, isError: isErrorLead } = useQuery({
    queryKey: ['visa-lead', id],
    queryFn: () => getVisaLeadByIdApi(id),
    enabled: !!id,
  });

  return { lead, isLoadingLead, isErrorLead };
}
