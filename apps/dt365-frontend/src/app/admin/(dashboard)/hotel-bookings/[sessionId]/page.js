'use client';

import AdminHotelBookingDetailPage from '@travel-suite/frontend-shared/pages/admin/AdminHotelBookingDetailPage';

const brand = { label: 'Dummy Ticket 365', website: 'www.dummyticket365.com', websiteUrl: 'https://www.dummyticket365.com' };

export default function Page() {
  return <AdminHotelBookingDetailPage brand={brand} />;
}
