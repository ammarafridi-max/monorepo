'use client';

import AdminTransferDashboardPage from '@travel-suite/frontend-shared/pages/admin/AdminTransferDashboardPage';
import { useGetBookings } from '@travel-suite/frontend-shared/hooks/limo-bookings/useGetBookings';

const toRow = (b) => ({
  id: b._id,
  ref: b.bookingRef,
  customer: `${b.bookingDetails?.firstName || ''} ${b.bookingDetails?.lastName || ''}`.trim(),
  email: b.bookingDetails?.email,
  route:
    b.tripType === 'hourly'
      ? `${b.pickup?.name} · ${b.hoursBooked} h hourly`
      : `${b.pickup?.name} → ${b.dropoff?.name}`,
  createdAt: b.createdAt,
  status: b.payment?.status === 'paid' ? b.status : b.payment?.status,
  statusGroup: b.payment?.status === 'paid' ? (b.status === 'pending' ? 'paid' : b.status) : 'pending',
  amount: `${(b.payment?.currency || '').toUpperCase()} ${b.payment?.amount ?? ''}`.trim(),
});

export default function Page() {
  return <AdminTransferDashboardPage useBookings={useGetBookings} toRow={toRow} />;
}
