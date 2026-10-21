'use client';
import AdminDummyTicketDetailPage from '@travel-suite/frontend-shared/pages/admin/AdminDummyTicketDetailPage';

const brand = {
  label: 'Travl',
  website: 'www.Travl.ae',
  websiteUrl: 'https://www.Travl.ae',
};

export default function Page() {
  return (
    <AdminDummyTicketDetailPage
      basePath="/admin/flight-reservations"
      backLabel="Back to flight reservations"
      brand={brand}
    />
  );
}
