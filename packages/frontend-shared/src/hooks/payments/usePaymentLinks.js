'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createPaymentLinkApi,
  getPaymentLinkApi,
  listPaymentLinksApi,
  updatePaymentLinkActiveApi,
} from '../../services/apiPayments.js';

export function usePaymentLinks({ status, page = 1, limit = 20 } = {}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-payment-links', status ?? null, page, limit],
    queryFn: () => listPaymentLinksApi({ status, page, limit }),
  });
  return {
    paymentLinks: data?.items ?? [],
    pagination: data?.pagination,
    isLoadingPaymentLinks: isLoading,
    isErrorPaymentLinks: isError,
    paymentLinksError: error,
  };
}

export function usePaymentLink(id) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-payment-link', id],
    queryFn: () => getPaymentLinkApi(id),
    enabled: Boolean(id),
  });
  return {
    paymentLink: data,
    isLoadingPaymentLink: isLoading,
    isErrorPaymentLink: isError,
    paymentLinkError: error,
  };
}

export function useSetPaymentLinkActive() {
  const queryClient = useQueryClient();

  const { mutate: setActive, isPending: isSettingActive } = useMutation({
    mutationFn: ({ id, active }) => updatePaymentLinkActiveApi(id, active),
    onSuccess: (updated) => {
      toast.success(
        updated?.status === 'active' ? 'Payment link enabled' : 'Payment link disabled',
      );
      queryClient.invalidateQueries({ queryKey: ['admin-payment-links'] });
      if (updated?._id) {
        queryClient.invalidateQueries({ queryKey: ['admin-payment-link', updated._id] });
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update payment link');
    },
  });

  return { setActive, isSettingActive };
}

export function useCreatePaymentLink() {
  const queryClient = useQueryClient();

  const { mutate: createPaymentLink, isPending: isCreatingPaymentLink } = useMutation({
    mutationFn: createPaymentLinkApi,
    onSuccess: (created) => {
      toast.success('Payment link created');
      queryClient.invalidateQueries({ queryKey: ['admin-payment-links'] });
      if (created?.url && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(created.url).catch(() => {});
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create payment link');
    },
  });

  return { createPaymentLink, isCreatingPaymentLink };
}
