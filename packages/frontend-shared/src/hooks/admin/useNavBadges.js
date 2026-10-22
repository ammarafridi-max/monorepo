'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdminBadgeCountsApi } from '../../services/apiAdminBadges.js';
import { getDummyTicketsApi } from '../../services/apiDummyTickets.js';
import { getConversationsApi } from '../../services/apiConversations.js';
import { getAdminVisaLeadsApi } from '../../services/apiVisaLeads.js';
import { visibleNavFor } from '../../components/admin/navIcons.js';

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

async function fetchBadges(keys) {
  const counts = await getAdminBadgeCountsApi();
  if (counts && keys.some((key) => key in counts)) return counts;

  // Brands that have not mounted /admin-badges still get their counts the slow way.
  const pairs = await Promise.all(
    keys.map(async (key) => {
      try {
        return [key, await BADGE_SOURCES[key]()];
      } catch {
        return [key, 0];
      }
    }),
  );
  return Object.fromEntries(pairs);
}

export function useNavBadges(nav = [], role, { enabled = true } = {}) {
  const keys = [
    ...new Set(
      visibleNavFor(nav, role)
        .flatMap((s) => s.items.map((i) => i.badge))
        .filter((k) => k && BADGE_SOURCES[k]),
    ),
  ];

  const { data } = useQuery({
    queryKey: [...NAV_BADGES_KEY, keys.join(',')],
    queryFn: () => fetchBadges(keys),
    enabled: enabled && !!role && keys.length > 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  return Object.fromEntries(keys.map((key) => [key, data?.[key] ?? 0]));
}
