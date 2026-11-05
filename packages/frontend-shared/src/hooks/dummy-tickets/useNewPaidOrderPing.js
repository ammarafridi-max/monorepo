'use client';

import { usePaidEntityPing } from '../general/usePaidEntityPing.js';
import { getLatestPaidTicketApi } from '../../services/apiDummyTickets.js';

const QUERY_KEYS = [['dummytickets'], ['nav-badges']];

export function useNewPaidOrderPing({ enabled = true } = {}) {
  usePaidEntityPing({
    enabled,
    eventsPath: '/api/tickets/events',
    fetchLatest: getLatestPaidTicketApi,
    queryKeys: QUERY_KEYS,
  });
}
