'use client';
import AdminDummyTicketDetailPage from '@travel-suite/frontend-shared/pages/admin/AdminDummyTicketDetailPage';

const brand = {
  label: 'Dummy Ticket 365',
  website: 'www.DummyTicket365.com',
  websiteUrl: 'https://www.DummyTicket365.com',
};

export default function Page() {
  return <AdminDummyTicketDetailPage brand={brand} />;
}
