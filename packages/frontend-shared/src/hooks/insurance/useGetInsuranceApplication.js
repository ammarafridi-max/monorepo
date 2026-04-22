'use client';
import { useQuery } from '@tanstack/react-query';
import { getInsuranceApplicationApi } from '../../services/apiInsurance.js';

export function useGetInsuranceApplication(sessionId) {
  const {
    data: application,
    isLoading: isLoadingApplication,
    isError: isErrorApplication,
  } = useQuery({
    queryKey: ['insuranceApplication', sessionId],
    queryFn: () => getInsuranceApplicationApi(sessionId),
    enabled: !!sessionId,
  });

  return {
    application,
    isLoadingApplication,
    isErrorApplication,
  };
}
