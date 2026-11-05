'use client';

import { usePaidEntityPing } from '../general/usePaidEntityPing.js';
import { getLatestPaidHotelBookingApi } from '../../services/apiHotelBookings.js';

const QUERY_KEYS = [['hotelBookings'], ['nav-badges']];

export function useNewPaidHotelBookingPing({ enabled = true } = {}) {
  usePaidEntityPing({
    enabled,
    eventsPath: '/api/hotel-bookings/events',
    fetchLatest: getLatestPaidHotelBookingApi,
    queryKeys: QUERY_KEYS,
  });
}
