'use client';
import AdminDummyTicketsPage from '@travel-suite/frontend-shared/pages/admin/AdminDummyTicketsPage';

export default function Page() {
  return (
    <AdminDummyTicketsPage
      basePath="/admin/flight-reservations"
      heading="Flight Reservations"
      itemNoun="reservation"
    />
  );
}
