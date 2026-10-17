'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminOrders, getAdminCustomers, STATUS_LABEL, usd } from '../../lib/adminApi';


export const PICTURESK_SEARCH_CATEGORIES = [
  { key: 'orders', label: 'Orders', color: 'bg-blue-50 text-blue-700' },
  { key: 'users', label: 'Users', color: 'bg-amber-50 text-amber-700' },
];

const LIMIT = 4;

export function usePictureskSearchResults(debouncedQuery, enabled) {
  const opts = { enabled, retry: false, staleTime: 15 * 1000 };

  const { data: orderData, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-search-orders', debouncedQuery],
    queryFn: () => getAdminOrders({ search: debouncedQuery, limit: LIMIT }),
    ...opts,
  });

  const { data: customerData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['admin-search-customers', debouncedQuery],
    queryFn: () => getAdminCustomers({ search: debouncedQuery, limit: LIMIT }),
    ...opts,
  });

  const loading = enabled && (loadingOrders || loadingCustomers);

  const results = useMemo(() => {
    if (!enabled) return {};
    return {
      orders: (orderData?.orders ?? []).slice(0, LIMIT).map((o) => ({
        id: o.orderId,
        primary: o.customerEmail || o.orderId,
        secondary: `${STATUS_LABEL[o.status] ?? o.status} · ${usd(o.amountPaidCents)}`,
        href: `/admin/orders/${o.orderId}`,
      })),
      users: (customerData?.customers ?? []).slice(0, LIMIT).map((c) => ({
        id: c.email,
        primary: c.email,
        secondary: `${c.orders} order${c.orders === 1 ? '' : 's'} · ${usd(c.totalPaidCents)}`,
        href: `/admin/orders?search=${encodeURIComponent(c.email)}`,
      })),
    };
  }, [enabled, orderData, customerData]);

  return { results, loading };
}
