'use client';

import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useNewPaidOrderPing } from '../../hooks/dummy-tickets/useNewPaidOrderPing';
import { useNewPaidHotelBookingPing } from '../../hooks/hotel-bookings/useNewPaidHotelBookingPing';

export default function NewOrderPinger({ tickets = true, hotels = false }) {
  const { isAdminAuthenticated } = useAdminAuth();
  useNewPaidOrderPing({ enabled: isAdminAuthenticated && tickets });
  useNewPaidHotelBookingPing({ enabled: isAdminAuthenticated && hotels });
  return null;
}
