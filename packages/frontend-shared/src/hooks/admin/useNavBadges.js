'use client';

import { useQueries } from '@tanstack/react-query';
import { getDummyTicketsApi } from '../../services/apiDummyTickets.js';
import { getConversationsApi } from '../../services/apiConversations.js';
import { getAdminVisaLeadsApi } from '../../services/apiVisaLeads.js';
import { visibleNavFor } from '../../components/admin/navIcons.js';

/**
 * A nav item opts in with `badge: '<key>'`. Each source returns the number the
 * sidebar shows next to that link; the list endpoints already exist, so a
 * count is one request with limit=1 and the pagination total.
 */
export const BADGE_SOURCES = {
  pendingDummyTickets: async () => {
    const res = await getDummyTicketsApi({ paymentStatus: 'PAID', orderStatus: 'PENDING', limit: 1 });
    return res?.pagination?.total ?? 0;
  },
  unreadChats: async () => {
    const list = await getConversationsApi({ status: 'OPEN', limit: 200 });
    return (list ?? []).filter((c) => (c.unreadCount ?? 0) > 0).length;
  },
  newVisaLeads: async () => {
    const res = await getAdminVisaLeadsApi({ status: 'new', limit: 1 });
    return res?.pagination?.total ?? 0;
  },
};

export const NAV_BADGES_KEY = ['nav-badges'];

export function useNavBadges(nav = [], role, { enabled = true } = {}) {
  const keys = [
    ...new Set(
      visibleNavFor(nav, role)
        .flatMap((s) => s.items.map((i) => i.badge))
        .filter((k) => k && BADGE_SOURCES[k]),
    ),
  ];

  const results = useQueries({
    queries: keys.map((key) => ({
      queryKey: [...NAV_BADGES_KEY, key],
      queryFn: BADGE_SOURCES[key],
      enabled: enabled && !!role,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
      retry: false,
    })),
  });

  return Object.fromEntries(keys.map((key, i) => [key, results[i]?.data ?? 0]));
}
