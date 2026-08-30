'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAdminOrders,
  getAdminOrder,
  getAdminStats,
  getAdminCustomers,
  refundOrder,
  retryOrder,
  resendOrderEmail,
  deleteOrder,
  bulkDeleteOrders,
} from '../../lib/adminApi';

export function useAdminOrders(params = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => getAdminOrders(params),
    placeholderData: (prev) => prev,
  });

  return {
    orders: data?.orders ?? [],
    stuckCount: data?.stuckCount ?? 0,
    stuckAfterMinutes: data?.stuckAfterMinutes,
    isLoadingOrders: isLoading,
    error,
  };
}

export function useAdminOrder(id) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => getAdminOrder(id),
    enabled: Boolean(id),
  });

  return { order: data ?? null, isLoadingOrder: isLoading, error };
}

export function useAdminStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  });

  return { stats: data ?? null, isLoadingStats: isLoading };
}

export function useAdminCustomers(params = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', params],
    queryFn: () => getAdminCustomers(params),
    placeholderData: (prev) => prev,
  });

  return { customers: data?.customers ?? [], isLoadingCustomers: isLoading };
}

/**
 * Order actions. Every one of these moves money or re-runs a paid job, so the
 * caller confirms first; this layer only reports the outcome and refetches.
 */
function useOrderAction(fn, successMessage) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: fn,
    onSuccess: (_data, id) => {
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => toast.error(err.message || 'That did not work'),
  });

  return [mutate, isPending];
}

export function useRefundOrder() {
  const [refund, isRefunding] = useOrderAction(refundOrder, 'Refund issued');
  return { refund, isRefunding };
}

export function useRetryOrder() {
  const [retry, isRetrying] = useOrderAction(retryOrder, 'Order requeued');
  return { retry, isRetrying };
}

export function useResendOrderEmail() {
  const [resend, isResending] = useOrderAction(resendOrderEmail, 'Delivery email sent');
  return { resend, isResending };
}

/**
 * Bulk delete. The endpoint is best effort per order, so a partial result is a
 * normal outcome and must be reported rather than swallowed as success.
 */
export function useBulkDeleteOrders() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: bulkDeleteOrders,
    onSuccess: (data) => {
      if (data?.failed) toast.error(`${data.deleted} deleted, ${data.failed} could not be`);
      else toast.success(`${data?.deleted ?? 0} order${data?.deleted === 1 ? '' : 's'} deleted`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (err) => toast.error(err.message || 'Could not delete those orders'),
  });
  return { bulkDelete: mutate, isBulkDeleting: isPending };
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      toast.success('Order deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => toast.error(err.message || 'Could not delete that order'),
  });
  return { remove: mutate, isDeleting: isPending };
}
