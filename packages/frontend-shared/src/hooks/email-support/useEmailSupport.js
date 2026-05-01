'use client';
import { useQuery } from '@tanstack/react-query';
import { getEmailsApi } from '../../services/apiEmailSupport.js';

export function useEmailSupport({ status, page = 1, limit = 20 } = {}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['email-support', status ?? null, page, limit],
    queryFn: () => getEmailsApi({ status, page, limit }),
  });

  return {
    emails: data?.data ?? [],
    pagination: data?.pagination,
    isLoadingEmails: isLoading,
    isErrorEmails: isError,
    emailsError: error,
  };
}
