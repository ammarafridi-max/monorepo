'use client';
import { useQuery } from '@tanstack/react-query';
import { getInsuranceDocumentsApi } from '../../services/apiInsurance.js';

export function useGetInsuranceDocuments(policyId) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['insurance-documents', policyId],
    queryFn: () => getInsuranceDocumentsApi(policyId),
    enabled: !!policyId,
  });

  return {
    documents: data ?? [],
    isLoadingDocuments: isLoading,
    isErrorDocuments: isError,
  };
}
